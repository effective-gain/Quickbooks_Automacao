import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const publicPaths = ['/login', '/register', '/api/webhooks']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  const response = await updateSession(request)

  // For protected routes, check if user is authenticated
  if (!isPublic && pathname !== '/') {
    const supabaseAuthCookie = request.cookies.getAll().find(c => c.name.includes('auth-token'))
    if (!supabaseAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
