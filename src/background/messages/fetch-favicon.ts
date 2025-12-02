import type { PlasmoMessaging } from "@plasmohq/messaging";
import { imageToBase64 } from "~background/services/base64";
import { getCache, setCache } from "~background/services/cache";

async function getImgByFavicon(favicon: string) {
  // 检查缓存
  const cache = await getCache(favicon);
  if (cache) {
    return cache;
  }

  try {
    const base64 = await imageToBase64(favicon);
    // URL 作为 key
    setCache(favicon, base64);
    return base64;
  } catch (e) {
    console.warn("Failed to fetch favicon by url:", favicon, e);
    return "";
  }
}

function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

async function getFaviconFromHtml(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return "";
    }

    const html = await response.text();

    // 匹配 link 标签
    // 1. rel 包含 icon
    // 2. 提取 href
    const linkRegex =
      /<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i;
    const match = html.match(linkRegex);

    if (match?.[1]) {
      const faviconUrl = resolveUrl(url, match[1]);
      return await imageToBase64(faviconUrl);
    }

    return "";
  } catch (e) {
    console.warn("Failed to fetch favicon from html:", url, e);
    return "";
  }
}

async function getFaviconFromRoot(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    const faviconUrl = `${urlObj.origin}/favicon.ico`;
    return await imageToBase64(faviconUrl);
  } catch {
    return "";
  }
}

async function getFaviconFromGoogle(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    return await imageToBase64(googleFaviconUrl);
  } catch {
    return "";
  }
}

async function getImgByUrl(url: string) {
  const cache = await getCache(url);
  if (cache) {
    return cache;
  }

  // 默认从 html 中取
  // 例如飞书文档这种，根目录中的 icon 是不准的
  let base64 = await getFaviconFromHtml(url);

  // 从根目录中取
  if (!base64) {
    base64 = await getFaviconFromRoot(url);
  }

  // 如果还失败，尝试 Google API
  if (!base64) {
    base64 = await getFaviconFromGoogle(url);
  }

  if (base64) {
    await setCache(url, base64);
    return base64;
  }

  return "";
}

/**
 * 请求 favicon
 */
const handler: PlasmoMessaging.MessageHandler<
  { url?: string; favicon?: string },
  { dataUrl?: string; success: boolean; message: string }
> = async (req, res) => {
  const { url, favicon } = req.body;

  try {
    if (!url && !favicon) {
      res.send({
        success: false,
        message: "缺少参数，需要 url 或者 favicon",
      });
      return;
    }

    // 有 favicon 就直接请求
    if (favicon) {
      const dataUrl = await getImgByFavicon(favicon);
      res.send({
        dataUrl,
        success: true,
        message: "请求成功",
      });
      return;
    }

    if (url) {
      const dataUrl = await getImgByUrl(url);
      res.send({
        dataUrl,
        success: !!dataUrl,
        message: dataUrl ? "请求成功" : "获取失败",
      });
    }
  } catch (e) {
    res.send({
      success: false,
      message: JSON.stringify(e),
    });
  }
};

export default handler;
