'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function GtmRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      // 当路由变化时，手动推送到 dataLayer
      window.dataLayer.push({
        event: 'page_view', // 这里的事件名可以自定义，需在 GTM 后台配置对应的 Trigger
        page_path: pathname,
      })
    }
  }, [pathname, searchParams])

  return null
}