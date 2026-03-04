"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { getListData, ListResponse } from "@/lib/api/list-api";

/* ─────────────────────────────────────────
   骨架屏：模拟列表行的占位动画
───────────────────────────────────────── */
function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          style={{
            borderBottom: "1px solid #eee",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* 标题骨架 */}
          <div
            style={{
              height: 16,
              width: `${55 + (i % 4) * 10}%`,
              background:
                "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              borderRadius: 4,
              animation: "skeleton-shimmer 1.4s infinite",
            }}
          />
          {/* 描述骨架 */}
          <div
            style={{
              height: 13,
              width: `${70 + (i % 3) * 8}%`,
              background:
                "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              borderRadius: 4,
              animation: "skeleton-shimmer 1.4s infinite",
              animationDelay: `${i * 0.05}s`,
            }}
          />
          {/* 日期骨架 */}
          <div
            style={{
              height: 11,
              width: 80,
              background:
                "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              borderRadius: 4,
              animation: "skeleton-shimmer 1.4s infinite",
              animationDelay: `${i * 0.05 + 0.1}s`,
            }}
          />
        </li>
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </ul>
  );
}

/* ─────────────────────────────────────────
   分页导航（纯按钮，click 触发翻页）
───────────────────────────────────────── */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  /** 生成要展示的页码数组（当前页前后各 2 页）。 */
  function getPageNumbers() {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  const pageNumbers = getPageNumbers();

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    textDecoration: active ? "underline" : "none",
    background: "none",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    color: "inherit",
  });

  const navBtnStyle = (enabled: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    fontSize: 14,
    background: "none",
    border: "none",
    cursor: enabled && !disabled ? "pointer" : "not-allowed",
    opacity: enabled && !disabled ? 1 : 0.35,
    color: "inherit",
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        marginTop: 32,
      }}
    >
      {/* 上一页 */}
      <button
        style={navBtnStyle(currentPage > 1)}
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Prev
      </button>

      {/* 首页省略 */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            style={btnStyle(false)}
            disabled={disabled}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span style={{ padding: "6px 4px", color: "#999" }}>…</span>
          )}
        </>
      )}

      {/* 页码 */}
      {pageNumbers.map((p) => (
        <button
          key={p}
          style={btnStyle(p === currentPage)}
          disabled={disabled || p === currentPage}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {/* 末页省略 */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span style={{ padding: "6px 4px", color: "#999" }}>…</span>
          )}
          <button
            style={btnStyle(false)}
            disabled={disabled}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 下一页 */}
      <button
        style={navBtnStyle(currentPage < totalPages)}
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </button>
    </nav>
  );
}

/* ─────────────────────────────────────────
   主组件：ListClient
───────────────────────────────────────── */
interface ListClientProps {
  initialData: ListResponse;
  pageSize: number;
}

export default function ListClient({ initialData, pageSize }: ListClientProps) {
  const [data, setData] = useState<ListResponse>(initialData);
  const [loading, setLoading] = useState(false);

  const handlePageChange = useCallback(
    async (page: number) => {
      if (loading || page === data.page) return;
      setLoading(true);
      try {
        const { promise } = getListData({ page, pageSize });
        const result = await promise;
        setData(result);
        // 同步更新地址栏（不触发路由跳转 / 不引发 GlobalLoading）
        window.history.pushState(null, "", `/list?page=${page}`);
      } finally {
        setLoading(false);
      }
    },
    [loading, data.page, pageSize],
  );

  return (
    <>
      {/* 摘要信息 */}
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Page {data.page} of {data.totalPages} · {data.total} items total
      </p>

      {/* 列表 / 骨架屏 */}
      {loading ? (
        <ListSkeleton rows={pageSize} />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.list.map((item) => (
            <li key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <Link
                href={`/list/${item.id}`}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {item.title}
                </div>
                <div style={{ color: "#888", fontSize: 14 }}>
                  {item.description}
                </div>
                <div style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 分页 */}
      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
      />
    </>
  );
}
