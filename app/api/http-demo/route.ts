import { NextRequest, NextResponse } from "next/server";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode") ?? "success";
  const wait = Number(searchParams.get("wait") ?? "1000");
  const delay = Number.isNaN(wait) ? 1000 : Math.max(wait, 0);

  // 人为增加延迟，方便在页面里演示取消请求和手动重试。
  await sleep(delay);

  if (mode === "code-error") {
    return NextResponse.json({
      code: 50001,
      message: "业务校验失败（用于演示 code 错误）",
      data: null,
    });
  }

  if (mode === "http-error") {
    return NextResponse.json(
      {
        message: "服务端异常（用于演示 HTTP 错误）",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    code: 0,
    message: "ok",
    data: {
      now: Date.now(),
      mode,
    },
  });
}
