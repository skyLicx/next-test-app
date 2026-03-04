/** 模拟列表项（与 API 约定一致）。 */
export interface MockListItem {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

/** 生成模拟数据（100 条），供列表与详情 API 共用。 */
export function generateMockListData(): MockListItem[] {
  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}.`,
    createdAt: new Date(
      Date.now() - (99 - i) * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));
}
