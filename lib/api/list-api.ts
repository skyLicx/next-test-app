import { http } from "@/app/http";

/** 列表项类型。 */
export interface ListItem {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

/** 分页列表响应数据。 */
export interface ListResponse {
  list: ListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 获取分页列表数据。
 * 客户端与服务端均可调用，baseUrl 由 http.ts 自动处理。
 */
export function getListData(params: { page?: number; pageSize?: number } = {}) {
  return http.get<ListResponse>("/api/list", {
    params: { page: params.page ?? 1, pageSize: params.pageSize ?? 10 },
  });
}

/**
 * 根据 id 获取单条列表项详情。
 */
export function getListItemById(id: number) {
  return http.get<ListItem>(`/api/list/${id}`);
}
