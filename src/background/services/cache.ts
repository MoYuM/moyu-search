import { Storage } from "@plasmohq/storage";

// 创建全局共享的 Storage 实例
const storage = new Storage({
  area: "local", // 使用本地存储，避免跨设备同步
});

export async function setCache(key: string, data: unknown): Promise<void> {
  await storage.set(key, data);
}

export async function getCache(key: string) {
  return await storage.get<string>(key);
}
