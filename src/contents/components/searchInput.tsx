import type { BangName, BangShortcut } from '~type'
import { forwardRef } from 'react'
import { NORMAL_KEYS, SEARCH_ENGINE_OPTIONS } from '~const'
import { DEFAULT_BANG_SEARCH_URLS, useUserOptions } from '~store/options'
import { t } from '~utils/i18n'
import { Key } from '../../key'
import HotkeyIcon from './hotkeyIcon'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  bangMode?: BangShortcut | null
  onBangModeChange?: (bang: BangShortcut | null) => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => {
  const { value, onChange, onKeyUp, bangMode, onBangModeChange } = props

  const userOptions = useUserOptions()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 允许通过 onChange 更新值，但阻止事件冒泡
    onChange(e.target.value)
    e.stopPropagation()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase()

    // 不要阻止 ctrl+p 事件冒泡
    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      return
    }

    // 处理 Tab 键触发 bang 模式
    if (e.key === 'Tab' && !bangMode && value.trim()) {
      e.preventDefault()
      const bangConfig = userOptions?.bangConfig || {}

      // 查找匹配的关键词
      const matchedBangName = Object.keys(bangConfig).find(bangName =>
        bangConfig[bangName as BangName] === value.trim(),
      ) as BangName | undefined

      if (matchedBangName) {
        const matchedBang = {
          keyword: bangConfig[matchedBangName],
          name: matchedBangName,
          searchUrl: DEFAULT_BANG_SEARCH_URLS[matchedBangName] || '',
        }
        onChange('')
        onBangModeChange?.(matchedBang)
        return
      }
    }

    // 处理 Backspace 键退出 bang 模式
    if (e.key === 'Backspace' && bangMode && value === '') {
      e.preventDefault()
      onBangModeChange?.(null)
      return
    }

    if (NORMAL_KEYS.includes(key)) {
      e.stopPropagation()
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyUp?.(e)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase()

    if (NORMAL_KEYS.includes(key)) {
      e.stopPropagation()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const searchEngineName = SEARCH_ENGINE_OPTIONS.find(item => item.value === userOptions?.searchEngine)?.label

  return (
    <div className="flex items-center gap-3 w-full px-2">
      {bangMode && (
        <div className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-xl shadow-cyan-500/50">
          {bangMode.name}
        </div>
      )}
      <input
        ref={ref}
        tabIndex={-1}
        className="w-full h-12 rounded-xl text-lg outline-none border-none focus:ring-0 shadow-none placeholder-gray-400 dark:placeholder-gray-500 bg-transparent text-gray-900 dark:text-gray-100"
        style={{ boxShadow: 'none', border: 'none' }}
        value={value}
        onChange={handleChange}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onCompositionUpdate={handleCompositionUpdate}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onKeyPress={handleKeyPress}
        placeholder={bangMode ? `在 ${bangMode.name} 中搜索...` : t('searchPlaceholder')}
        autoFocus={false}
      />
      <div className="flex items-center text-gray-400 dark:text-gray-500 gap-2">
        <span>{searchEngineName}</span>
        <HotkeyIcon keys={[Key.Shift, Key.Enter]} />
      </div>
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
