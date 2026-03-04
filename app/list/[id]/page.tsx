import Link from "next/link";
import { notFound } from "next/navigation";
import { getListItemById } from "@/lib/api/list-api";
import { ArrowLeft } from "lucide-react";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    notFound();
  }

  let item;
  try {
    const { promise } = getListItemById(idNum);
    item = await promise;
  } catch {
    notFound();
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <Link
        href="/list"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
          fontSize: 14,
          color: "#666",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <article
        style={{
          padding: "24px",
          border: "1px solid #eee",
          borderRadius: 8,
          backgroundColor: "#fafafa",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: "#999",
              marginBottom: 4,
            }}
          >
            ID: {item.id}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            {item.title}
          </h1>
          <time
            style={{ fontSize: 14, color: "#888", marginTop: 8, display: "block" }}
            dateTime={item.createdAt}
          >
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </header>
        <div
          style={{
            color: "#444",
            fontSize: 16,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {item.description}
        </div>
      </article>
    </main>
  );
}
