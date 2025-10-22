// 扩展消息类型定义
export interface ExtensionMessage {
  name: 'fetch-favicon' | 'get-recent-tabs' | 'get-all' | 'new-tab' | 'open-result' | 'switch-tab'
  body?: any
}


// 扩展上下文错误类型
export interface ExtensionContextError extends Error {
  message: string
  name: string
}

// 安全发送选项
export interface SafeSendOptions {
  retry?: boolean
  maxRetries?: number
  retryDelay?: number
}

// 扩展消息类型枚举
export enum ExtensionMessageType {
  CLEANUP_OLD_CONTENT_SCRIPT = 'CLEANUP_OLD_CONTENT_SCRIPT',
  REINJECT_CONTENT_SCRIPT = 'REINJECT_CONTENT_SCRIPT'
}

// 扩展消息处理器类型
export type ExtensionMessageHandler = (
  message: { type: ExtensionMessageType; success?: boolean },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void