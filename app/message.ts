/** 支持的消息类型。 */
type MessageType = "success" | "error" | "warning" | "info";

/** message 入参。 */
export interface MessageOptions {
  /** 展示内容。 */
  content: string;
  /** 自动关闭时间（毫秒），默认 3000。 */
  duration?: number;
}

/** message 内部事件载荷。 */
export interface MessagePayload {
  /** 唯一标识，用于关闭和定时器管理。 */
  id: string;
  /** 展示类型。 */
  type: MessageType;
  /** 文本内容。 */
  content: string;
  /** 自动关闭时间。 */
  duration: number;
}

/** message 事件：打开或关闭。 */
type MessageEvent =
  | { type: "open"; payload: MessagePayload }
  | { type: "close"; payload: { id?: string } };

/** 事件订阅回调定义。 */
type MessageListener = (event: MessageEvent) => void;

const DEFAULT_DURATION = 3000;
// 轻量事件总线：不依赖第三方库，供任意客户端模块触发 message。
const listeners = new Set<MessageListener>();
let seed = 0;

/** 生成消息 ID。 */
function createId() {
  seed += 1;
  return `${Date.now()}-${seed}`;
}

/** 广播事件给所有订阅者。 */
function emit(event: MessageEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

/** 统一把 string/object 入参转成内部标准结构。 */
function normalizeInput(
  input: string | MessageOptions,
  type: MessageType,
): MessagePayload {
  if (typeof input === "string") {
    return {
      id: createId(),
      type,
      content: input,
      duration: DEFAULT_DURATION,
    };
  }

  return {
    id: createId(),
    type,
    content: input.content,
    duration: input.duration ?? DEFAULT_DURATION,
  };
}

/** 以指定类型打开消息。 */
function openWithType(type: MessageType, input: string | MessageOptions) {
  const payload = normalizeInput(input, type);
  emit({ type: "open", payload });
  return payload.id;
}

/** 关闭消息；不传 id 表示关闭全部。 */
function close(id?: string) {
  emit({ type: "close", payload: { id } });
}

/** 订阅 message 事件，返回取消订阅函数。 */
export function subscribeMessage(listener: MessageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const message = {
  // open 支持完全自定义类型；其余 success/error 等是快捷方法。
  /** 通用打开方法，可自定义 type。 */
  open(input: MessageOptions & { type?: MessageType }) {
    const payload = normalizeInput(input, input.type ?? "info");
    emit({ type: "open", payload });
    return payload.id;
  },
  /** 成功消息。 */
  success(input: string | MessageOptions) {
    return openWithType("success", input);
  },
  /** 错误消息。 */
  error(input: string | MessageOptions) {
    return openWithType("error", input);
  },
  /** 警告消息。 */
  warning(input: string | MessageOptions) {
    return openWithType("warning", input);
  },
  /** 信息消息。 */
  info(input: string | MessageOptions) {
    return openWithType("info", input);
  },
  /** 关闭消息。 */
  close,
};
