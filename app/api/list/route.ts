import { NextRequest, NextResponse } from "next/server";

/** 模拟列表项。 */
interface MockItem {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

/** 生成模拟数据（100 条）。 */
function generateMockData(): MockItem[] {
  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}.`,
    createdAt: new Date(
      Date.now() - (99 - i) * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));
}

const mockData = generateMockData();

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
