export interface SearchResult {
  type: 'tab' | 'history' | 'bookmark' | 'search' | 'bang-search'
  id: string
  title: string
  url: string
  lastAccessed?: number
  lastVisitTime?: number
  dateAdded?: number
  favicon?: string
  faviconDataUrl?: string
  titlePinyin?: string
  titlePinyinInitials?: string
  bangMode?: BangShortcut
}

export interface BangShortcut {
  keyword: string
  name: string
  searchUrl: string
}
