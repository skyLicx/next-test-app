import { getListData } from "@/lib/api/list-api";
import ListClient from "./ListClient";

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

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Paginated List
      </h1>
      <ListClient initialData={data} pageSize={pageSize} />
    </main>
  );
}
