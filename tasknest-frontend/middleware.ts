import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('accessToken')?.value

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/register/')

  const isProtectedPage =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/boards')

  // No token + trying to access protected page → go to login
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Has token + trying to access auth page → go to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
