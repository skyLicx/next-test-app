import { http } from "@/app/http";

/** 账户信息类型（示例）。 */
export interface AccountInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * 获取当前用户账户信息。
 * TODO: 对接真实接口后替换路径。
 */
export function getAccountInfo() {
  return http.get<AccountInfo>("/api/account");
}
