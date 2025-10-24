/**
 * 获取国际化消息
 * @param key 消息键
 * @param substitutions 参数替换数组
 * @returns 国际化后的消息
 */
export function t(key: string, substitutions?: string[] | Record<string, string>): string {
  if (substitutions) {
    if (Array.isArray(substitutions)) {
      return chrome.i18n.getMessage(key, substitutions) || ''
    }
    else {
      // 处理对象形式的参数替换
      const message = chrome.i18n.getMessage(key) || ''
      return message.replace(/\{(\w+)\}/g, (match, placeholder) => {
        return substitutions[placeholder] || match
      })
    }
  }
  return chrome.i18n.getMessage(key) || ''
}
