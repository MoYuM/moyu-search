import type { PlasmoMessaging } from '@plasmohq/messaging'
import { getOrCacheFavicon } from '../services/favicon-cache'

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { url, favicon } = req.body

  if (!favicon) {
    res.send({ dataUrl: null })
    return
  }

  try {
    const dataUrl = await getOrCacheFavicon(url, favicon)
    res.send({ dataUrl })
  }
  catch {
    res.send({ dataUrl: null })
  }
}

export default handler
