import { NextResponse } from "next/server";
import type { AccountInfo } from "@/lib/api/account-api";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** 模拟当前用户账户信息（示例）。 */
function getMockAccountInfo(): AccountInfo {
  return {
    id: "user-001",
    name: "示例用户",
    email: "user@example.com",
  };
}

export async function GET() {
  const data = getMockAccountInfo();
  await sleep(2000);
  return NextResponse.json({
    code: 20,
    message: "ok1",
    data,
  });
}
