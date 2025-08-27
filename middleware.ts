import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only run middleware for specific auth-related routes
  const authRoutes = ['/auth', '/auth/login', '/auth/signup'];
  const protectedRoutes = ['/dashboard', '/profile', '/recipes/create', '/settings'];

  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname === route);
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Skip middleware for non-auth routes to avoid unnecessary processing
  if (!isAuthRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (isProtectedRoute && !session) {
      // Redirect to auth page if trying to access protected route without session
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthRoute && session) {
      // Redirect to dashboard if authenticated user tries to access auth pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue with the request even if there's an error
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match only auth-related routes:
     * - /auth and sub-routes
     * - /dashboard and sub-routes
     * - /profile and sub-routes
     * - /recipes/create
     * - /settings and sub-routes
     */
    '/auth/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/saved/:path*',
    '/recipes/create',
    '/recipes/:path*',
    '/settings/:path*',
  ],
};
