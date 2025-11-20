export interface SearchResult {
  type: 'tab' | 'history' | 'bookmark' | 'search' | 'bang-search'
  id: string
  title: string
  url: string
  lastAccessed?: number
  lastVisitTime?: number
  dateAdded?: number
  favicon?: string
  titlePinyin?: string
  titlePinyinInitials?: string
  bangMode?: BangShortcut
}

export interface BangShortcut {
  keyword: string
  name: string
  searchUrl: string
}

// Bang 名称类型
export type BangName = 'V2EX' | 'Reddit' | 'Wikipedia' | 'ChatGPT' | 'GitHub'
export type BangConfig = Record<BangName, string>
