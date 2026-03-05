import { notFound } from "next/navigation";
import { getListItemById } from "@/lib/api/list-api";
import ListDetailClient from "./ListDetailClient";

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

  let initialData = null;
  try {
    const { promise } = getListItemById(idNum);
    initialData = await promise;
  } catch {
    notFound();
  }

  return (
    <ListDetailClient id={idNum} initialData={initialData} />
  );
}
