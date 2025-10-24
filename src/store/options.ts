import type { BangConfig } from '~type'
import { Storage } from '@plasmohq/storage'
import { useStorage } from '@plasmohq/storage/hook'
import { merge } from 'lodash-es'
import { useMemo } from 'react'

export const userOptionStorage = new Storage()

export const STORAGE_KEY = 'userOptions'

/**
 * 默认 Bang 配置 - 与表单字段一一对应
 */
export const DEFAULT_BANG_CONFIG: BangConfig = {
  V2EX: 'v2ex',
  Reddit: 'reddit',
  Wikipedia: 'wiki',
  ChatGPT: 'chatgpt',
  GitHub: 'gh',
}

/**
 * 默认 Bang 搜索 URL 配置
 */
export const DEFAULT_BANG_SEARCH_URLS: BangConfig = {
  V2EX: 'https://www.google.com/search?q=site:v2ex.com+{query}',
  Reddit: 'https://www.reddit.com/search/?q={query}',
  Wikipedia: 'https://en.wikipedia.org/w/index.php?search={query}',
  ChatGPT: 'https://chatgpt.com/?q={query}',
  GitHub: 'https://github.com/search?q={query}',
}

/**
 * 默认配置
 */
export const DEFAULT_OPTIONS: UserOptions = {
  searchEngine: 'google',
  appearance: 'system',
  hotkey: 'ctrl+p',
  bangConfig: DEFAULT_BANG_CONFIG,
}

export interface UserOptions {
  /** 搜索引擎 */
  searchEngine: 'google' | 'bing' | 'baidu'
  /** 外观 */
  appearance: 'light' | 'dark' | 'system'
  /** 触发弹窗的快捷键 */
  hotkey: string
  /** Bang 配置 - 与表单字段一一对应 */
  bangConfig: BangConfig
}

export async function getUserOptions() {
  const userOptions = await userOptionStorage.get(STORAGE_KEY)
  return userOptions || DEFAULT_OPTIONS
}

export async function setUserOptions(userOptions: UserOptions) {
  await userOptionStorage.set(STORAGE_KEY, userOptions)
}

export function useUserOptions() {
  const [options] = useStorage<UserOptions>({
    key: STORAGE_KEY,
    instance: userOptionStorage,
  })

  return useMemo(() => {
    return merge({}, DEFAULT_OPTIONS, options)
  }, [options])
}
