import type { BangShortcut } from '~type'
import { useCallback } from 'react'
import { useUserOptions } from '~store/options'

/**
 * Bang 快捷方式相关 Hook
 * @returns 获取 bang 快捷方式的方法
 */
export function useBangShortcuts() {
  const userOptions = useUserOptions()

  const bangShortcuts: BangShortcut[] = userOptions.bangShortcuts || []

  const findBangByKeyword = useCallback((keyword: string): BangShortcut | null => {
    return bangShortcuts.find(bang => bang.keyword === keyword) || null
  }, [bangShortcuts])

  const getBangSearchUrl = useCallback((bang: BangShortcut, query: string): string => {
    return bang.searchUrl.replace('{query}', encodeURIComponent(query))
  }, [])

  return {
    bangShortcuts,
    findBangByKeyword,
    getBangSearchUrl,
  }
}
