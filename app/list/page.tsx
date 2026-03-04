import Link from "next/link";
import { getListData } from "@/lib/api/list-api";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(Number(pageStr ?? "1"), 1);
  const pageSize = 10;

  const { promise } = getListData({ page: currentPage, pageSize });
  const data = await promise;

  /** 生成要展示的页码数组（当前页前后各 2 页）。 */
  function getPageNumbers() {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(data.totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Paginated List
      </h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Page {data.page} of {data.totalPages} · {data.total} items total
      </p>

      {/* 列表 */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {data.list.map((item) => (
          <li
            key={item.id}
            style={{
              borderBottom: "1px solid #eee",
            }}
          >
            <Link
              href={`/list/${item.id}`}
              style={{
                display: "block",
                padding: "16px 20px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
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

      {/* 分页导航 */}
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
        {currentPage > 1 ? (
          <Link
            href={`/list?page=${currentPage - 1}`}
            style={{ padding: "6px 12px", fontSize: 14 }}
          >
            ← Prev
          </Link>
        ) : (
          <span style={{ padding: "6px 12px", fontSize: 14, color: "#ccc" }}>
            ← Prev
          </span>
        )}

        {/* 页码 */}
        {pageNumbers[0] > 1 && (
          <>
            <Link
              href="/list?page=1"
              style={{ padding: "6px 10px", fontSize: 14 }}
            >
              1
            </Link>
            {pageNumbers[0] > 2 && (
              <span style={{ padding: "6px 4px", color: "#999" }}>…</span>
            )}
          </>
        )}
        {pageNumbers.map((p) => (
          <Link
            key={p}
            href={`/list?page=${p}`}
            style={{
              padding: "6px 10px",
              fontSize: 14,
              fontWeight: p === currentPage ? 700 : 400,
              textDecoration: p === currentPage ? "underline" : "none",
            }}
          >
            {p}
          </Link>
        ))}
        {pageNumbers[pageNumbers.length - 1] < data.totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < data.totalPages - 1 && (
              <span style={{ padding: "6px 4px", color: "#999" }}>…</span>
            )}
            <Link
              href={`/list?page=${data.totalPages}`}
              style={{ padding: "6px 10px", fontSize: 14 }}
            >
              {data.totalPages}
            </Link>
          </>
        )}

        {/* 下一页 */}
        {currentPage < data.totalPages ? (
          <Link
            href={`/list?page=${currentPage + 1}`}
            style={{ padding: "6px 12px", fontSize: 14 }}
          >
            Next →
          </Link>
        ) : (
          <span style={{ padding: "6px 12px", fontSize: 14, color: "#ccc" }}>
            Next →
          </span>
        )}
      </nav>
    </main>
  );
}
