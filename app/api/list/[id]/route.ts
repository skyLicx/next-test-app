import { NextRequest, NextResponse } from "next/server";
import { generateMockListData } from "@/lib/mock-list-data";

const mockData = generateMockListData();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    return NextResponse.json(
      { code: 400, message: "Invalid id", data: null },
      { status: 400 },
    );
  }
  const item = mockData.find((x) => x.id === idNum);
  if (!item) {
    return NextResponse.json(
      { code: 404, message: "Not found", data: null },
      { status: 404 },
    );
  }
  return NextResponse.json({ code: 0, message: "ok", data: item });
}
