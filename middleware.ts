import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // ULTRA AGGRESSIVE CACHE BLOCKING - PERMANENT AND COMPLETE
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, no-transform, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '-1')
  response.headers.set('Surrogate-Control', 'no-store')
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  response.headers.set('Edge-Cache-Control', 'no-store')
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icon-|apple-touch-icon|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
