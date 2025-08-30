import { Storage } from '@plasmohq/storage'

// 创建全局共享的 Storage 实例
const storage = new Storage({
  area: 'local', // 使用本地存储，避免跨设备同步
})

const prefix = 'favicon_'

// 从URL中提取缓存key (host + pathname)
function getFaviconCacheKey(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${prefix}${urlObj.host}${urlObj.pathname}`
  }
  catch {
    return `${prefix}${url}`
  }
}

// 获取缓存的 favicon
async function getFaviconFromCache(url: string): Promise<string | undefined> {
  const cacheKey = getFaviconCacheKey(url)
  return await storage.get<string>(cacheKey)
}

// 获取 host 级别的 favicon 缓存（从已有的精确缓存中推断）
async function getHostFaviconFromCache(url: string): Promise<string | undefined> {
  try {
    const urlObj = new URL(url)
    const host = urlObj.host

    // 由于无法获取所有键，我们采用一个简化的策略：
    // 尝试一些常见的路径来推断favicon
    const commonPaths = ['', '/', '/index', '/home', '/main']

    for (const path of commonPaths) {
      const testKey = `${prefix}${host}${path}`
      const cached = await storage.get<string>(testKey)
      if (cached) {
        return cached
      }
    }

    return undefined
  }
  catch {
    // 如果URL解析失败，返回undefined
    return undefined
  }
}

// 智能获取 favicon：优先精确匹配，再 host 级别匹配
async function getFaviconSmart(url: string): Promise<string | undefined> {
  // 1. 优先尝试精确匹配 (host + pathname)
  const exactMatch = await getFaviconFromCache(url)
  if (exactMatch) {
    return exactMatch
  }

  // 2. 如果没有精确匹配，尝试 host 级别匹配
  const hostMatch = await getHostFaviconFromCache(url)
  if (hostMatch) {
    return hostMatch
  }

  // 3. 都没有找到，返回 undefined
  return undefined
}

// 将 favicon 存储到缓存
async function setFaviconToCache(url: string, dataUrl: string): Promise<void> {
  const cacheKey = getFaviconCacheKey(url)
  await storage.set(cacheKey, dataUrl)
}

// 将图片转换为base64
async function imageToBase64(imageUrl: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()

    // 检查文件大小限制 (1MB)
    if (blob.size > 1024 * 1024) {
      throw new Error('Image too large (max 1MB)')
    }

    // 检查文件类型
    if (!blob.type.startsWith('image/')) {
      throw new Error('Not an image file')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Image download timeout (10s)')
    }
    throw error
  }
  finally {
    clearTimeout(timeoutId)
  }
}

// 获取或缓存 favicon
export async function getOrCacheFavicon(url?: string, faviconUrl?: string): Promise<string | undefined> {
  if (!faviconUrl) {
    console.error('没有 faviconUrl')
    return undefined
  }

  if (!url) {
    console.error('没有 URL')
    return undefined
  }

  // 检查缓存
  const cached = await getFaviconFromCache(url)
  if (cached) {
    return cached
  }

  try {
    // 获取新的 favicon 并转换为 base64
    const base64Data = await imageToBase64(faviconUrl)

    // 存储到缓存
    await setFaviconToCache(url, base64Data)

    return base64Data
  }
  catch (error) {
    console.warn('Failed to get or cache favicon for:', url, error)
    return undefined
  }
}

// 为搜索项处理 favicon：优先使用现有 favicon，再尝试智能推断
export async function processFaviconForItem(url: string, favicon?: string): Promise<string | undefined> {
  try {
    let faviconDataUrl: string | undefined

    // 1. 如果有 favicon，优先使用 getOrCacheFavicon
    if (favicon) {
      faviconDataUrl = await getOrCacheFavicon(url, favicon)
    }

    // 2. 如果没有 favicon 或获取失败，尝试智能推断
    if (!faviconDataUrl) {
      faviconDataUrl = await getFaviconSmart(url)
    }

    return faviconDataUrl
  }
  catch (error) {
    console.warn('Favicon processing failed for:', url, error)
    return undefined
  }
}
