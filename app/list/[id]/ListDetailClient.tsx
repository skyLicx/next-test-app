"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { HttpRequestError } from "@/app/http";
import { getListItemById, type ListItem } from "@/lib/api/list-api";

interface ListDetailClientProps {
  id: number;
  initialData?: ListItem | null;
}

export default function ListDetailClient({
  id,
  initialData,
}: ListDetailClientProps) {
  const { data: item, isPending, isError, error } = useQuery({
    queryKey: ["list", "detail", id],
    queryFn: () => getListItemById(id).promise,
    initialData: initialData ?? undefined,
  });

  const router = useRouter();

  if (isError) {
    if (error instanceof HttpRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (isPending && !item) {
    return (
      <main
        className="mx-auto max-w-[800px] px-4 py-6"
        style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}
      >
        <Link
          href="/list"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 no-underline"
        >
          <ArrowLeft size={16} />
          返回列表
        </Link>
        <div
          className="animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 p-6"
          style={{
            padding: "24px",
            border: "1px solid #eee",
            borderRadius: 8,
            backgroundColor: "#fafafa",
          }}
        >
          <div className="mb-4 h-4 w-12 rounded bg-neutral-200" />
          <div className="mb-2 h-6 w-3/4 rounded bg-neutral-200" />
          <div className="mb-4 h-4 w-32 rounded bg-neutral-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-neutral-200" />
            <div className="h-4 w-[80%] rounded bg-neutral-200" />
            <div className="h-4 w-2/3 rounded bg-neutral-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <main
      className="mx-auto max-w-[800px] px-4 py-6"
      style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}
    >
      <div
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 no-underline"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
          fontSize: 14,
          color: "#666",
          textDecoration: "none",
        }}
        onClick={() => router.back()}
      >
        <ArrowLeft size={16} />
        返回列表
      </div>

      <article
        className="rounded-lg border border-neutral-200 bg-neutral-50 p-6"
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
            style={{
              fontSize: 14,
              color: "#888",
              marginTop: 8,
              display: "block",
            }}
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
