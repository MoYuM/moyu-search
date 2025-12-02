import Circle from "react:/assets/circle.svg";
import { useCallback, useEffect, useState } from "react";
import type { ExtensionMessage } from "~types/extension";
import { safeSendToBackgroundSimple } from "~utils/safeSendToBackground";

function FaviconImg({ favicon, url }: { favicon?: string; url: string }) {
  const [src, setSrc] = useState<string>("");

  const loadFavicon = useCallback(async () => {
    try {
      const message: ExtensionMessage = {
        name: "fetch-favicon",
        body: { url, favicon },
      };
      const response = await safeSendToBackgroundSimple(message);

      if (response.dataUrl) {
        setSrc(response.dataUrl);
      } else {
        setSrc("");
      }
    } catch {
      setSrc("");
    }
  }, [url, favicon]);

  // 组件挂载时加载favicon
  useEffect(() => {
    if (url || favicon) {
      loadFavicon();
    }
  }, [url, favicon, loadFavicon]);

  // 显示加载中的占位符或默认图标
  if (!src) {
    return (
      <div className="w-4 h-4 rounded flex items-center justify-center">
        <Circle className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      className="w-4 h-4 rounded"
      alt="tab"
      onError={(e) => {
        e.currentTarget.onerror = null;
        setSrc("");
      }}
    />
  );
}

export default FaviconImg;
