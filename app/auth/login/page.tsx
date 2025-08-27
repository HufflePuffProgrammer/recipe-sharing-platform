import { LoginForm } from '@/app/components/auth/LoginForm';
import { AuthGuard } from '@/app/components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your Galley account
            </p>
          </div>
          <LoginForm redirectTo="/" />
        </div>
      </div>
    </AuthGuard>
  );
}
