// 监听扩展更新事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    console.log("Extension updated, cleaning up old content scripts...");
    cleanupOldContentScripts();
  }
});

// 清理旧的 content scripts
async function cleanupOldContentScripts() {
  try {
    // 获取所有标签页
    const tabs = await chrome.tabs.query({});

    // 向所有标签页发送清理消息
    const cleanupPromises = tabs.map((tab) => {
      if (tab.id) {
        return chrome.tabs
          .sendMessage(tab.id, {
            type: "CLEANUP_OLD_CONTENT_SCRIPT",
          })
          .catch(() => {
            // 忽略无法发送消息的标签页（可能是无效的扩展上下文）
          });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(cleanupPromises);
    console.log("Old content scripts cleanup completed");
  } catch (error) {
    console.error("Error cleaning up old content scripts:", error);
  }
}

// 监听来自 content script 的重新注入请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REINJECT_CONTENT_SCRIPT" && sender.tab?.id) {
    reinjectContentScript(sender.tab.id);
    sendResponse({ success: true });
  }
});

// 重新注入 content script
async function reinjectContentScript(tabId: number) {
  try {
    // 对于 Plasmo 框架，我们只需要通知页面重新加载 content script
    // 实际的注入由 Plasmo 的构建系统处理
    await chrome.tabs
      .sendMessage(tabId, {
        type: "REINJECT_CONTENT_SCRIPT",
      })
      .catch(() => {
        // 如果发送消息失败，说明页面可能没有 content script
        // 这种情况下，我们不需要做任何操作，因为 Plasmo 会自动处理
      });

    console.log(`Content script reinjection requested for tab ${tabId}`);
  } catch (error) {
    console.error(
      `Error requesting content script reinjection for tab ${tabId}:`,
      error,
    );
  }
}

chrome.runtime.connect().onDisconnect.addListener(() => {
  console.log("onDisconnect");
  // 保持连接监听器
});
