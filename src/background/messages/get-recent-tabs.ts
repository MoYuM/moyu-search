import type { PlasmoMessaging } from '@plasmohq/messaging'
import type { SearchResult } from '../../type'

export type RequestBody = undefined
export interface ResponseBody {
  results: SearchResult[]
}

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (_, res) => {
  try {
    const allTabs = await chrome.tabs.query({
        status: 'complete',
        currentWindow: true,
    })
      
    const recentTabs = allTabs
      .filter(tab => tab.id && tab.url && !tab.url.startsWith('chrome://'))
      .sort((a: any, b: any) => b.lastAccessed - a.lastAccessed)
      .slice(0, 6)
      .map(tab => ({
        id: tab.id!.toString(),
        title: tab.title || '',
        url: tab.url!,
        favicon: tab.favIconUrl,
      }))

    const tabResults: SearchResult[] = recentTabs.map(tab => ({
      type: 'tab',
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favicon: tab.favicon,
      lastAccessed: Date.now(),
    }))

    res.send({
      results: tabResults,
    })
  } catch (error) {
    console.error('Error in get-recent-tabs handler:', error)
    res.send({
      results: [],
    })
  }
}

export default handler
