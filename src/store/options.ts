import type { BangShortcut } from '~type'
import { Storage } from '@plasmohq/storage'
import { useStorage } from '@plasmohq/storage/hook'

export const userOptionStorage = new Storage()

export const STORAGE_KEY = 'userOptions'

/**
 * 默认 Bang 快捷方式配置
 */
export const DEFAULT_BANG_SHORTCUTS: BangShortcut[] = [
  {
    keyword: 'v2ex',
    name: 'V2EX',
    searchUrl: 'https://www.google.com/search?q=site:v2ex.com+{query}',
  },
  {
    keyword: 'reddit',
    name: 'Reddit',
    searchUrl: 'https://www.reddit.com/search/?q={query}',
  },
  {
    keyword: 'wiki',
    name: 'Wikipedia',
    searchUrl: 'https://en.wikipedia.org/w/index.php?search={query}',
  },
  {
    keyword: 'chatgpt',
    name: 'ChatGPT',
    searchUrl: 'https://chatgpt.com/?q={query}',
  },
]

/**
 * 默认配置
 */
export const DEFAULT_OPTIONS: UserOptions = {
  searchEngine: 'google',
  appearance: 'system',
  hotkey: 'ctrl+p',
  bangShortcuts: DEFAULT_BANG_SHORTCUTS,
}

export interface UserOptions {
  /** 搜索引擎 */
  searchEngine: 'google' | 'bing' | 'baidu'
  /** 外观 */
  appearance: 'light' | 'dark' | 'system'
  /** 触发弹窗的快捷键 */
  hotkey: string
  /** Bang 快捷方式 */
  bangShortcuts: BangShortcut[]
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
  const mergedOptions: UserOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  return mergedOptions
}
