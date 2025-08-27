"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = '/auth',
  requireAuth = true
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User needs to be authenticated but isn't
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        // User is authenticated but this is a public-only route
        router.push('/');
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If this is a public-only route but user is authenticated, don't render children
  if (!requireAuth && user) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
