"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * GlobalLoading
 *
 * 路由切换原理：
 * - 用户点击 <Link> 时，Next.js 会立即开始 prefetch / navigation，
 *   但页面 Server Component 的数据还未返回，pathname 尚未改变。
 * - 我们通过拦截全局 click 事件（检测点击的 <a> 是否为同站内部链接）来
 *   "提前"感知导航意图，从而立刻显示 loading overlay。
 * - 当 pathname 或 searchParams 发生变化时（即新页面数据已加载完毕、
 *   React 已完成渲染），再隐藏 loading。
 */
export default function GlobalLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // 用 ref 记录"导航目标 URL"，避免在当前页面内的无效点击触发 loading
  const pendingUrl = useRef<string | null>(null);

  useEffect(() => {
    /**
     * 判断一个锚点元素是否指向同站内部页面（排除 hash、外链、download 等）
     */
    function isInternalLink(anchor: HTMLAnchorElement): boolean {
      if (anchor.target === "_blank") return false;
      if (anchor.hasAttribute("download")) return false;
      if (!anchor.href) return false;
      try {
        const url = new URL(anchor.href);
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    }

    function handleClick(e: MouseEvent) {
      // 只处理左键点击，且未按修饰键
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;

      // 向上遍历 DOM 找到 <a> 元素
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !isInternalLink(target)) return;

      const url = new URL(target.href);
      const destination = url.pathname + url.search;

      // 若目标与当前路由完全一致，不显示 loading
      const current =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : "");
      if (destination === current) return;

      pendingUrl.current = destination;
      setLoading(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, searchParams]);

  // 当路由真正切换完成后，隐藏 loading（使用 queueMicrotask 避免 effect 内同步 setState 引发级联渲染）
  useEffect(() => {
    queueMicrotask(() => {
      setLoading(false);
      pendingUrl.current = null;
    });
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: "opacity 0.2s ease",
      }}
      aria-label="Loading"
      role="status"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "global-spin 0.75s linear infinite",
          }}
        />
        <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
          Loading…
        </span>
      </div>

      <style>{`
        @keyframes global-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
