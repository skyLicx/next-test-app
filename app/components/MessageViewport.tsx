"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MessagePayload } from "@/app/message";
import { subscribeMessage } from "@/app/message";

/** 视图层消息结构，补充创建时间用于后续扩展（如排序/动画）。 */
interface ViewMessage extends MessagePayload {
  createdAt: number;
}

/** 记录每条消息对应的自动关闭定时器。 */
type TimerMap = Map<string, ReturnType<typeof setTimeout>>;

/** 根据消息类型返回对应样式与图标。 */
function getTypeStyle(type: ViewMessage["type"]) {
  if (type === "success") {
    return {
      wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
      icon: <CircleCheck className="h-4 w-4 text-emerald-600" />,
    };
  }

  if (type === "warning") {
    return {
      wrapper: "border-amber-200 bg-amber-50 text-amber-900",
      icon: <TriangleAlert className="h-4 w-4 text-amber-600" />,
    };
  }

  if (type === "error") {
    return {
      wrapper: "border-rose-200 bg-rose-50 text-rose-900",
      icon: <CircleAlert className="h-4 w-4 text-rose-600" />,
    };
  }

  return {
    wrapper: "border-zinc-200 bg-zinc-50 text-zinc-900",
    icon: <Info className="h-4 w-4 text-zinc-600" />,
  };
}

export default function MessageViewport() {
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  // 保存每条消息的自动关闭定时器，便于关闭/卸载时统一清理。
  const timersRef = useRef<TimerMap>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const removeMessage = useCallback(
    (id: string) => {
      clearTimer(id);
      setMessages((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  useEffect(() => {
    const timers = timersRef.current;

    const unsubscribe = subscribeMessage((event) => {
      if (event.type === "close") {
        if (event.payload.id) {
          removeMessage(event.payload.id);
          return;
        }

        for (const timer of timers.values()) {
          clearTimeout(timer);
        }
        timers.clear();
        setMessages([]);
        return;
      }

      const nextMessage: ViewMessage = {
        ...event.payload,
        createdAt: Date.now(),
      };

      setMessages((prev) => {
        const merged = [...prev, nextMessage];
        if (merged.length <= 3) {
          return merged;
        }

        // 核心约束：message 同时最多展示 3 条，超出时移除最旧消息。
        const removed = merged.slice(0, merged.length - 3);
        for (const item of removed) {
          clearTimer(item.id);
        }
        return merged.slice(-3);
      });

      const timer = setTimeout(() => {
        removeMessage(nextMessage.id);
      }, Math.max(nextMessage.duration, 800));

      timers.set(nextMessage.id, timer);
    });

    return () => {
      unsubscribe();
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, [clearTimer, removeMessage]);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-9999 flex w-[min(92vw,400px)] flex-col gap-2">
      {messages.map((item) => {
        const style = getTypeStyle(item.type);
        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm ${style.wrapper}`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">{style.icon}</div>
              <div className="flex-1 text-sm leading-6">{item.content}</div>
              <button
                type="button"
                aria-label="关闭"
                className="cursor-pointer rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                onClick={() => removeMessage(item.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
