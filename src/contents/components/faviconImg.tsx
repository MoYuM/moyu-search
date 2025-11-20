import type { ExtensionMessage } from '~types/extension'
import { useEffect, useState } from 'react'
import Circle from 'react:/assets/circle.svg'
import { safeSendToBackgroundSimple } from '~utils/safeSendToBackground'

function FaviconImg({ favicon, url }: { favicon?: string, url: string }) {
  const [src, setSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 检测是否为 base64 格式
  const isBase64 = (str: string): boolean => {
    // base64 格式通常以 data: 开头，或者符合 base64 字符集规则
    return str.startsWith('data:') || /^[A-Z0-9+/]*={0,2}$/i.test(str)
  }

  const loadFavicon = async () => {
    if (!favicon) {
      setIsLoading(false)
      return
    }

    // 如果已经是 base64 格式，直接使用
    if (isBase64(favicon)) {
      setSrc(favicon)
      setIsLoading(false)
      return
    }

    try {
      const message: ExtensionMessage = {
        name: 'fetch-favicon',
        body: { url, favicon },
      }
      const response = await safeSendToBackgroundSimple(message)

      if (response.dataUrl) {
        setSrc(response.dataUrl)
      }
      else {
        setSrc('')
      }
    }
    catch {
      setSrc('')
    }
    finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时加载favicon
  useEffect(() => {
    if (url && favicon) {
      loadFavicon()
    }
    else {
      setIsLoading(false)
    }
  }, [url, favicon])

  // 显示加载中的占位符或默认图标
  if (isLoading || !src) {
    return (
      <div className="w-4 h-4 rounded flex items-center justify-center">
        <Circle className="w-3 h-3 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      className="w-4 h-4 rounded"
      alt="tab"
      onError={(e) => {
        e.currentTarget.onerror = null
        setSrc('')
      }}
    />
  )
}

export default FaviconImg
