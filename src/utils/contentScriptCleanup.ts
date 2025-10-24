import { ExtensionMessageType, type ExtensionMessageHandler } from '~types/extension'
import { resetExtensionContext, markExtensionContextInvalid, isExtensionContextValidState } from './safeSendToBackground'

// 清理 DOM 元素
export const cleanupDOM = () => {
  // 移除当前 content script 的 DOM 元素
  const existingPopup = document.querySelector('[data-moyu-search-popup]')
  if (existingPopup) {
    existingPopup.remove()
  }
  
  // 移除样式
  const existingStyle = document.querySelector('[data-moyu-search-style]')
  if (existingStyle) {
    existingStyle.remove()
  }
}

// 创建消息处理器
export const createMessageHandler = (): ExtensionMessageHandler => {
  return (message, sender, sendResponse) => {
    if (message.type === ExtensionMessageType.CLEANUP_OLD_CONTENT_SCRIPT) {
      console.log('Received cleanup message, removing old content script...')
      cleanupDOM()
      markExtensionContextInvalid()
      sendResponse({ success: true })
    } else if (message.type === ExtensionMessageType.REINJECT_CONTENT_SCRIPT) {
      console.log('Received reinjection message, resetting context validity...')
      resetExtensionContext()
      sendResponse({ success: true })
    }
  }
}

// 创建页面可见性变化监听器
export const createVisibilityChangeListener = () => {
  return () => {
    if (!document.hidden && !isExtensionContextValidState()) {
      console.log('Page became visible, attempting to restore extension context...')
      resetExtensionContext()
    }
  }
}

// 初始化 cleanup 系统
export const initializeCleanupSystem = () => {
  // 注册消息监听器
  const messageHandler = createMessageHandler()
  chrome.runtime.onMessage.addListener(messageHandler)
  
  // 注册页面可见性变化监听器
  const visibilityListener = createVisibilityChangeListener()
  document.addEventListener('visibilitychange', visibilityListener)
  
  return {
    cleanup: cleanupDOM
  }
}