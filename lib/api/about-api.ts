import { http } from "@/app/http";

/** About 页面数据类型（示例）。 */
export interface AboutData {
  title: string;
  content: string;
}

/**
 * 获取 About 页面数据。
 * TODO: 对接真实接口后替换路径。
 */
export function getAboutData() {
  return http.get<AboutData>("/api/about");
}
