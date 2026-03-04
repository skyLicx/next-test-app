import { message } from "@/app/message";

/** 是否为服务端环境。 */
const isServer = typeof window === "undefined";

/**
 * 默认基础 URL：
 * - 客户端：空字符串（使用相对路径）
 * - 服务端：优先取 NEXT_PUBLIC_BASE_URL 环境变量，否则回退到 localhost:3000
 */
const DEFAULT_BASE_URL = isServer
  ? (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
  : "";

/** URL 查询参数允许的值类型。 */
type QueryValue = string | number | boolean | null | undefined;
/** 重试间隔：可固定毫秒值，也可按重试次数动态计算。 */
type RetryDelay = number | ((attempt: number) => number);

/**
 * 约定的后端响应包裹结构。
 * 若后端不返回该结构，也可通过 `parseJson` 走原始 JSON 返回。
 */
interface ApiEnvelope<T> {
  code: number | string;
  message?: string;
  data?: T;
}

/**
 * 请求配置项。
 * 在原生 RequestInit 基础上，补充了业务常用能力：重试、超时、业务码校验、自动提示等。
 */
export interface HttpRequestOptions extends Omit<RequestInit, "body" | "signal"> {
  /** 基础 URL，服务端默认 http://localhost:3000，客户端默认空（相对路径）。可通过 NEXT_PUBLIC_BASE_URL 环境变量覆盖。 */
  baseUrl?: string;
  /** URL 查询参数，会拼接到请求地址上。 */
  params?: Record<string, QueryValue>;
  /** 请求体；对象会自动 JSON.stringify。 */
  body?: unknown;
  /** 自动重试次数（不包含首次请求）。 */
  retry?: number;
  /** 每次重试前的等待时间。 */
  retryDelay?: RetryDelay;
  /** 超时时间（毫秒）；默认 6 分钟，传 0 可关闭超时控制。 */
  timeoutMs?: number;
  /** 业务成功码列表，默认 [0, 200]。 */
  successCodes?: number[];
  /** 是否按 JSON 解析响应，默认 true。 */
  parseJson?: boolean;
  /** 请求失败时是否自动 message 提示，默认 true。 */
  showErrorMessage?: boolean;
  /** 兜底错误文案。 */
  errorMessage?: string;
}

/**
 * 统一请求错误类型。
 * - status: HTTP 状态码错误（如 404/500）
 * - code: 业务码错误（如 code !== 0）
 * - isCanceled: 是否由取消/重试中断引发
 */
export class HttpRequestError extends Error {
  readonly status?: number;
  readonly code?: number;
  readonly isCanceled: boolean;

  constructor(
    messageText: string,
    options?: { status?: number; code?: number; isCanceled?: boolean },
  ) {
    super(messageText);
    this.name = "HttpRequestError";
    this.status = options?.status;
    this.code = options?.code;
    this.isCanceled = options?.isCanceled ?? false;
  }
}

/** 一次“可控请求任务”的句柄。 */
export interface HttpTask<T> {
  // 当前这次请求（或最近一次 retry 后的请求）对应的 Promise。
  promise: Promise<T>;
  // 主动取消当前进行中的请求。
  cancel: () => void;
  // 中断当前请求并立刻重新发起；返回新的 Promise。
  retry: () => Promise<T>;
}

/** 请求中断原因，用于区分提示文案和重试策略。 */
type AbortReason = "none" | "user-cancel" | "manual-retry";

/** 默认业务成功码。 */
const DEFAULT_SUCCESS_CODES = [0, 200];
/** 默认重试等待时长（毫秒）。 */
const DEFAULT_RETRY_DELAY = 500;
/** 默认请求超时时长（毫秒）：6 分钟。 */
const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000;

/** 简单 sleep，用于重试前等待。 */
function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** unknown -> 对象 类型守卫。 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 判断响应是否为约定的 ApiEnvelope 结构。 */
function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    isObject(value) &&
    "code" in value &&
    (typeof value.code === "number" || typeof value.code === "string")
  );
}

/** 统一解析重试间隔，确保不小于 0。 */
function resolveRetryDelay(retryDelay: RetryDelay | undefined, attempt: number) {
  if (typeof retryDelay === "function") {
    return Math.max(retryDelay(attempt), 0);
  }
  return retryDelay ?? DEFAULT_RETRY_DELAY;
}

/** 追加 URL 查询参数，自动跳过 undefined/null。 */
function appendParams(url: string, params?: Record<string, QueryValue>) {
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  if (!query) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

/** 归一化任意错误对象为 HttpRequestError。 */
function normalizeError(error: unknown, fallback?: string) {
  if (error instanceof HttpRequestError) {
    return error;
  }
  if (error instanceof Error && error.message.trim()) {
    return new HttpRequestError(error.message);
  }
  return new HttpRequestError(fallback ?? "请求失败，请稍后重试");
}

/** 规范化请求体与请求头。 */
function toBodyAndHeaders(body: unknown, headers: Headers) {
  if (body === undefined || body === null) {
    return { body: undefined, headers };
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return {
      body: body as BodyInit,
      headers,
    };
  }

  if (!headers.has("Content-Type")) {
    // 传普通对象时默认按 JSON 提交。
    headers.set("Content-Type", "application/json");
  }
  return {
    body: JSON.stringify(body),
    headers,
  };
}

/** 判断当前错误是否允许自动重试。 */
function shouldRetry(error: HttpRequestError, attempt: number, retry: number) {
  if (error.isCanceled) {
    return false;
  }
  return attempt < retry;
}

/**
 * 解析响应体：
 * 1) parseJson=false 时返回 text；
 * 2) 非 ApiEnvelope 时直接返回原始 JSON；
 * 3) ApiEnvelope 时按 successCodes 判断是否成功。
 */
async function parseResponseData<T>(
  response: Response,
  options: Pick<HttpRequestOptions, "parseJson" | "successCodes">,
) {
  const parseJson = options.parseJson ?? true;
  if (!parseJson) {
    return (await response.text()) as T;
  }

  const payload: unknown = await response.json();
  if (!isApiEnvelope<T>(payload)) {
    // 非 { code, data } 结构，按原始 JSON 直接返回。
    return payload as T;
  }

  const codeNumber = Number(payload.code);
  const successCodes = options.successCodes ?? DEFAULT_SUCCESS_CODES;
  if (!Number.isNaN(codeNumber) && !successCodes.includes(codeNumber)) {
    throw new HttpRequestError(
      payload.message ?? `请求失败，业务码: ${String(payload.code)}`,
      { code: codeNumber },
    );
  }

  if ("data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

/** 根据中断原因映射为可读错误。 */
function getAbortError(reason: AbortReason, timedOut: boolean) {
  if (reason === "manual-retry") {
    return new HttpRequestError("请求已被重试中断", { isCanceled: true });
  }
  if (reason === "user-cancel") {
    return new HttpRequestError("请求已取消", { isCanceled: true });
  }
  if (timedOut) {
    return new HttpRequestError("请求超时，请重试");
  }
  return new HttpRequestError("请求已中断", { isCanceled: true });
}

/** 判断是否为浏览器 fetch 的 AbortError。 */
function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * 创建一个可取消、可重试的请求任务。
 * 返回值是任务句柄（promise/cancel/retry），便于在 UI 层控制请求生命周期。
 */
function createRequestTask<T>(url: string, options: HttpRequestOptions = {}): HttpTask<T> {
  const maxRetry = Math.max(options.retry ?? 0, 0);
  const showErrorMessage = options.showErrorMessage ?? true;
  let runId = 0;
  // 记录当前活跃请求，供 cancel/retry 中断使用。
  let active:
    | {
        controller: AbortController;
        reason: { value: AbortReason };
        id: number;
      }
    | undefined;

  const requestInit: Omit<RequestInit, "body" | "signal" | "headers"> = {
    method: options.method ?? "GET",
    cache: options.cache,
    credentials: options.credentials,
    integrity: options.integrity,
    keepalive: options.keepalive,
    mode: options.mode,
    next: options.next,
    priority: options.priority,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
  };

  const base = options.baseUrl ?? DEFAULT_BASE_URL;
  const fullUrl = base ? `${base}${url}` : url;
  const endpoint = appendParams(fullUrl, options.params);
  const headers = new Headers(options.headers);
  const parsedBody = toBodyAndHeaders(options.body, headers);

  /** 真正执行一次请求流程；自动重试在此内部完成。 */
  async function execute(id: number): Promise<T> {
    // attempt=0 为首次请求；后续为自动重试。
    for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
      const controller = new AbortController();
      const reason = { value: "none" as AbortReason };
      active = { controller, reason, id };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
      }

      try {
        const response = await fetch(endpoint, {
          ...requestInit,
          headers: parsedBody.headers,
          body: parsedBody.body,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new HttpRequestError(`请求失败，HTTP状态码: ${response.status}`, {
            status: response.status,
          });
        }

        const data = await parseResponseData<T>(response, options);
        return data;
      } catch (rawError) {
        let normalized: HttpRequestError;

        if (isAbortError(rawError)) {
          normalized = getAbortError(reason.value, timedOut);
        } else {
          normalized = normalizeError(rawError, options.errorMessage);
        }

        if (shouldRetry(normalized, attempt, maxRetry)) {
          // 自动重试只在非取消类错误下生效。
          await sleep(resolveRetryDelay(options.retryDelay, attempt + 1));
          continue;
        }

        if (showErrorMessage && !isServer && reason.value !== "manual-retry") {
          if (normalized.isCanceled) {
            message.warning(normalized.message);
          } else {
            message.error(normalized.message);
          }
        }
        throw normalized;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (active?.id === id && active.controller === controller) {
          active = undefined;
        }
      }
    }

    throw new HttpRequestError("请求失败，请重试");
  }

  /** 取消当前活跃请求。 */
  function cancel() {
    if (!active) {
      return;
    }
    active.reason.value = "user-cancel";
    active.controller.abort();
  }

  /** 手动重试：中断旧请求并立即发起新请求。 */
  async function retry() {
    if (active) {
      // 手动重试时，中断旧请求且避免旧请求再次弹错。
      active.reason.value = "manual-retry";
      active.controller.abort();
    }

    runId += 1;
    currentPromise = execute(runId);
    return currentPromise;
  }

  let currentPromise = execute(runId);

  return {
    // 始终返回当前最新一次请求对应的 Promise（包含手动 retry 后的）。
    get promise() {
      return currentPromise;
    },
    cancel,
    retry,
  };
}

export const http = {
  /** 通用请求入口。 */
  request: createRequestTask,
  /** GET 请求快捷方法。 */
  get<T>(url: string, options: Omit<HttpRequestOptions, "method"> = {}) {
    return createRequestTask<T>(url, { ...options, method: "GET" });
  },
  /** POST 请求快捷方法。 */
  post<T, B = unknown>(
    url: string,
    body?: B,
    options: Omit<HttpRequestOptions, "method" | "body"> = {},
  ) {
    return createRequestTask<T>(url, { ...options, method: "POST", body });
  },
  /** PUT 请求快捷方法。 */
  put<T, B = unknown>(
    url: string,
    body?: B,
    options: Omit<HttpRequestOptions, "method" | "body"> = {},
  ) {
    return createRequestTask<T>(url, { ...options, method: "PUT", body });
  },
  /** DELETE 请求快捷方法。 */
  delete<T>(url: string, options: Omit<HttpRequestOptions, "method"> = {}) {
    return createRequestTask<T>(url, { ...options, method: "DELETE" });
  },
};
