import type { IFuseOptions } from 'fuse.js'
import type { ExtensionMessage } from '~types/extension'
import type { BangShortcut, SearchResult } from '../type'
import clsx from 'clsx'
import cssText from 'data-text:~style.css'
import Fuse from 'fuse.js'
import { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import Bookmark from 'react:/assets/bookmark.svg'
import Box from 'react:/assets/box.svg'
import Clock from 'react:/assets/clock.svg'
import Search from 'react:/assets/search.svg'
import { useSearchEngine } from '~hooks/useSearchEngine'
import { useTheme } from '~hooks/useTheme'

import { DEFAULT_OPTIONS, useUserOptions } from '~store/options'
import { safeSendToBackground } from '~utils/safeSendToBackground'
import { Key } from '../key'
import FaviconImg from './components/faviconImg'
import SearchInput from './components/searchInput'

const IconMap: Record<SearchResult['type'], any> = {
  'tab': Box,
  'history': Clock,
  'bookmark': Bookmark,
  'search': Search,
  'bang-search': Search,
}

const fuseOptions: IFuseOptions<SearchResult> = {
  includeScore: true,
  useExtendedSearch: true,
  threshold: 0.3,
  keys: [
    'title',
    'url',
    'titlePinyin',
    'titlePinyinInitials',
  ],
}

export function getStyle() {
  const style = document.createElement('style')
  style.textContent = cssText
  style.setAttribute('data-moyu-search-style', 'true')
  return style
}

const { ArrowUp, ArrowDown, Enter, Escape, Shift, Control } = Key

function Popup() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [bangMode, setBangMode] = useState<BangShortcut | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const isMoved = useRef(false)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const fuseRef = useRef<Fuse<SearchResult> | null>(null)

  const { getSearchItem, getSearchUrl } = useSearchEngine()
  const [theme] = useTheme()
  const userOptions = useUserOptions()

  const getBangSearchUrl = (bang: BangShortcut, query: string): string => {
    return bang.searchUrl.replace('{query}', encodeURIComponent(query))
  }

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // 搜索内容变化时，activeIndex 归零
  useEffect(() => {
    setActiveIndex(0)
  }, [searchQuery])

  // activeIndex 变化时自动滚动到可见
  useEffect(() => {
    if (itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'instant',
      })
    }
  }, [activeIndex])

  // 新增：本地搜索函数
  const handleSearch = (keyword: string) => {
    if (!keyword)
      return
    if (!fuseRef.current)
      return

    const searchResults = fuseRef.current.search(keyword)
    const seenTitle = new Set<string>()
    const tabs: SearchResult[] = []
    const others: SearchResult[] = []

    for (const { item } of searchResults) {
      const title = item.title || item.url
      if (!seenTitle.has(title)) {
        seenTitle.add(title)
        if (item.type === 'tab') {
          tabs.push(item)
        }
        else {
          others.push(item)
        }
      }
    }

    let newList = [...tabs, ...others]

    // 如果处于 bang mode，在列表开头添加 bang 搜索项
    if (bangMode && keyword.trim()) {
      const bangSearchItem: SearchResult = {
        type: 'bang-search',
        id: `bang-search-${bangMode.keyword}`,
        title: `使用 ${bangMode.name} 进行搜索`,
        url: getBangSearchUrl(bangMode, keyword),
        bangMode,
      }
      newList = [bangSearchItem, ...newList]
    }

    if (newList.length === 0 && keyword.trim()) {
      const searchItem = getSearchItem(keyword)
      newList.push(searchItem)
    }

    setList(newList)
  }

  // -------- handler --------

  const handleDirectSearch = () => {
    const searchUrl = bangMode
      ? getBangSearchUrl(bangMode, searchQuery)
      : getSearchUrl(searchQuery)
    const message: ExtensionMessage = {
      name: 'new-tab',
      body: { url: searchUrl },
    }
    safeSendToBackground(message, { retry: true }).catch((error) => {
      console.error('Failed to open new tab:', error)
    })
    handleClose()
  }

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + list.length) % list.length)
  }

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % list.length)
  }

  const loadRecentTabs = async () => {
    try {
      const message: ExtensionMessage = { name: 'get-recent-tabs' }
      const { results } = await safeSendToBackground<{ results: SearchResult[] }>(message, { retry: true })
      setList(results)
    }
    catch (error) {
      console.error('Failed to load recent tabs:', error)
      setList([])
    }
  }

  const handleOpen = async () => {
    setOpen(true)
    loadRecentTabs()
    loadAllData()
  }

  const handleClose = () => {
    setOpen(false)
    setSearchQuery('')
    setActiveIndex(0)
    setList([])
    setBangMode(null)
    isMoved.current = false
  }

  // 新增：加载所有数据并初始化搜索
  const loadAllData = async () => {
    try {
      const message: ExtensionMessage = {
        name: 'get-all',
        body: { forceRefresh: false },
      }
      const { results, fuseIndex } = await safeSendToBackground<{
        results: SearchResult[]
        fuseIndex: any
      }>(message, { retry: true })

      if (fuseIndex) {
        const parsedIndex = Fuse.parseIndex(fuseIndex)
        fuseRef.current = new Fuse<SearchResult>(results, fuseOptions, parsedIndex)
      }
      else {
        fuseRef.current = new Fuse<SearchResult>(results, fuseOptions)
      }
    }
    catch (error) {
      console.error('Failed to load all data:', error)
      // 如果加载失败，至少加载最近的标签页
      loadRecentTabs()
    }
  }

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    if (value) {
      handleSearch(value)
    }
    else {
      loadRecentTabs()
    }
  }
  const handleOpenResult = (item?: SearchResult) => {
    const res = item || list[activeIndex]

    // 如果选中的是 bang 搜索项，直接使用 bang 搜索
    if (res.type === 'bang-search' && res.bangMode) {
      const searchUrl = getBangSearchUrl(res.bangMode, searchQuery)
      const message: ExtensionMessage = {
        name: 'new-tab',
        body: { url: searchUrl },
      }
      safeSendToBackground(message, { retry: true }).catch((error) => {
        console.error('Failed to open new tab:', error)
      })
    }
    else {
      // 其他情况都按照原逻辑处理，直接跳转到对应的 tab
      const message: ExtensionMessage = {
        name: 'open-result',
        body: res,
      }
      safeSendToBackground(message, { retry: true }).catch((error) => {
        console.error('Failed to open result:', error)
      })
    }
    handleClose()
  }

  const handleCtrlP = () => {
    if (open) {
      isMoved.current = true
      handleNext()
    }
    else {
      handleOpen()
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === Control && isMoved.current) {
      handleOpenResult()
    }
  }

  // -------- 快捷键 --------

  useHotkeys(Escape, handleClose, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: '关闭搜索框',
  })

  useHotkeys(ArrowDown, handleNext, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: '选择下一个结果',
  })

  useHotkeys(ArrowUp, handlePrev, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: '选择上一个结果',
  })

  useHotkeys(Enter, () => handleOpenResult(), {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: '打开选中结果',
  })

  useHotkeys(`${Shift}+${Enter}`, handleDirectSearch, {
    enabled: open,
    preventDefault: true,
    enableOnFormTags: true,
    description: '直接使用搜索引擎搜索关键词',
  })

  // 可配置的快捷键处理
  useHotkeys(userOptions?.hotkey || DEFAULT_OPTIONS.hotkey, handleCtrlP, {
    document,
    enableOnFormTags: true,
    enableOnContentEditable: true,
    preventDefault: true,
    description: '打开搜索框继续按下则选择下一个，直到松开则打开结果，类似 vscode 的 cmd+p',
  }, [open, list.length, userOptions?.hotkey])

  // 根据搜索结果类型获取图标
  const getResultIcon = (item: SearchResult) => {
    const Icon = IconMap[item.type]
    if (Icon) {
      return <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
    }
  }

  return (
    <div
      className={`fixed left-0 top-0 w-screen h-screen z-[9999] ${theme}`}
      style={{ display: open ? 'block' : 'none' }}
      onClick={handleClose}
      data-moyu-search-popup
    >
      <div
        className={`
          absolute left-1/2 top-1/4 -translate-x-1/2 w-[700px] p-2 flex flex-col rounded-3xl shadow-2xl ${open ? 'block' : 'hidden'}
          bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
        `}
        onClick={e => e.stopPropagation()}
      >
        <SearchInput
          ref={inputRef}
          value={searchQuery}
          onChange={handleSearchQueryChange}
          onKeyUp={handleKeyUp}
          bangMode={bangMode}
          onBangModeChange={setBangMode}
        />
        <div className="flex flex-col gap-1 mt-2 overflow-y-auto rounded-xl max-h-96 min-h-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {list?.map((item, index) => (
            <div
              key={`${item.id}-${item.url}`}
              ref={el => itemRefs.current[index] = el}
              onClick={() => handleOpenResult(item)}
              className={clsx(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-none',
                {
                  'bg-zinc-200 dark:bg-zinc-700': index === activeIndex,
                },
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FaviconImg favicon={item.favicon} url={item.url} />
                <div className="truncate flex-1 text-base font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400 select-none">
                {getResultIcon(item)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Popup
