/**
 * 转换为 base64
 */
export async function imageToBase64(imageUrl: string): Promise<string> {
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
