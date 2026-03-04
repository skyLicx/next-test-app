"use client";

import { useRef, useState } from "react";
import { http, type HttpTask } from "@/app/http";
import { message } from "@/app/message";

interface DemoResult {
  now: number;
  mode: string;
}

export default function AccountPage() {
  // 持有最近一次请求任务，便于取消和手动重试。
  const taskRef = useRef<HttpTask<DemoResult> | null>(null);
  const [result, setResult] = useState<string>("暂无结果");

  const startRequest = (mode: "success" | "code-error" | "http-error") => {
    const task = http.get<DemoResult>("/api/http-demo", {
      params: {
        mode,
        wait: 300,
      },
      retryDelay: (attempt) => attempt * 800,
    });

    taskRef.current = task;
    task.promise
      .then((data) => {
        setResult(JSON.stringify(data));
        message.success("请求成功");
      })
      .catch(() => {
        // 失败提示已由 http 封装统一处理（此处无需重复提示）
      });
  };

  const cancelRequest = () => {
    taskRef.current?.cancel();
  };

  const retryRequest = () => {
    const task = taskRef.current;
    if (!task) {
      message.info("当前没有可重试的请求");
      return;
    }

    task
      .retry()
      .then((data) => {
        setResult(JSON.stringify(data));
        message.success("重试成功");
      })
      .catch(() => {
        // 失败提示已由 http 封装统一处理（此处无需重复提示）
      });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">HTTP 封装演示</h2>
      <p className="text-sm text-zinc-600">
        支持：code 错误/异常提示、自动重试、手动重试、取消请求、message 最多展示 3
        条
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => startRequest("success")}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700"
        >
          成功请求
        </button>
        <button
          type="button"
          onClick={() => startRequest("code-error")}
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white transition hover:bg-amber-700"
        >
          触发 code 错误
        </button>
        <button
          type="button"
          onClick={() => startRequest("http-error")}
          className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white transition hover:bg-rose-700"
        >
          触发 HTTP 错误
        </button>
        <button
          type="button"
          onClick={retryRequest}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white transition hover:bg-zinc-900"
        >
          手动重试
        </button>
        <button
          type="button"
          onClick={cancelRequest}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          取消请求
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
        最近响应：{result}
      </div>
    </section>
  );
}