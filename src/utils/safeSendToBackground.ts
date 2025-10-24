import { sendToBackground } from '@plasmohq/messaging'
import type { ExtensionMessage, SafeSendOptions, ExtensionContextError } from '~types/extension'
import { ExtensionMessageType } from '~types/extension'

// 检查是否为扩展上下文失效错误
export const isExtensionContextError = (error: any): error is ExtensionContextError => {
  return error?.message?.includes('Extension context invalidated') ||
         error?.message?.includes('Receiving end does not exist') ||
         error?.name === 'ExtensionContextInvalidatedError'
}

// 默认配置
const DEFAULT_OPTIONS: Required<SafeSendOptions> = {
  retry: false,
  maxRetries: 3,
  retryDelay: 1000
}

// 扩展上下文状态管理
let isExtensionContextValid = true
let retryCount = 0
const MAX_RETRY_COUNT = 3

// 重置扩展上下文状态
export const resetExtensionContext = () => {
  isExtensionContextValid = true
  retryCount = 0
}

// 标记扩展上下文失效
export const markExtensionContextInvalid = () => {
  isExtensionContextValid = false
}

// 检查扩展上下文是否有效
export const isExtensionContextValidState = () => isExtensionContextValid

// 获取重试计数
export const getRetryCount = () => retryCount

// 增加重试计数
export const incrementRetryCount = () => {
  retryCount++
}

// 检查是否超过最大重试次数
export const isMaxRetriesExceeded = () => retryCount >= MAX_RETRY_COUNT

// 安全的 sendToBackground 包装函数
export const safeSendToBackground = async <T = any>(
  message: ExtensionMessage,
  options: SafeSendOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  if (!isExtensionContextValidState() && isMaxRetriesExceeded()) {
    throw new Error('Extension context invalidated and max retries exceeded')
  }
  
  try {
    const result = await sendToBackground(message as any)
    return result
  } catch (error) {
    if (isExtensionContextError(error)) {
      console.log('Extension context invalidated, attempting recovery...')
      markExtensionContextInvalid()
      incrementRetryCount()
      
      if (config.retry && !isMaxRetriesExceeded()) {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * getRetryCount()))
        
        // 请求 background script 重新注入 content script
        try {
          await chrome.runtime.sendMessage({ type: ExtensionMessageType.REINJECT_CONTENT_SCRIPT })
          // 重置状态并重试
          resetExtensionContext()
          return await safeSendToBackground<T>(message, { ...config, retry: false })
        } catch (reinjectError) {
          console.error('Failed to request content script reinjection:', reinjectError)
        }
      }
      
      throw new Error('Extension context invalidated, content script will be reinjected')
    }
    throw error
  }
}

// 简化的安全发送函数（用于不需要重试的场景）
export const safeSendToBackgroundSimple = async <T = any>(
  message: ExtensionMessage
): Promise<T> => {
  return safeSendToBackground<T>(message, { retry: false })
}