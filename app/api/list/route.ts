import { NextRequest, NextResponse } from "next/server";
import { generateMockListData } from "@/lib/mock-list-data";

const mockData = generateMockListData();
function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") ?? "10"), 1),
    100,
  );

  const total = mockData.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const list = mockData.slice(start, start + pageSize);

  await sleep(2000);
  return NextResponse.json({
    code: 0,
    message: "ok",
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages,
    },
  });
}
