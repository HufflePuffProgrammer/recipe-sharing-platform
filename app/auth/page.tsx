"use client";

import { useState } from 'react';
import { LoginForm } from '@/app/components/auth/LoginForm';
import { SignUpForm } from '@/app/components/auth/SignUpForm';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { Button } from '@/app/components/ui/button';
import { ChefHat } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-12 w-12 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Galley</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your recipe sharing community
            </p>
          </div>

          {/* Auth Toggle */}
          <div className="flex justify-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={isLogin ? "default" : "ghost"}
              onClick={() => setIsLogin(true)}
              className="flex-1"
            >
              Sign In
            </Button>
            <Button
              variant={!isLogin ? "default" : "ghost"}
              onClick={() => setIsLogin(false)}
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>

          {/* Auth Form */}
          {isLogin ? (
            <LoginForm
              onToggleMode={() => setIsLogin(false)}
              redirectTo="/"
            />
          ) : (
            <SignUpForm
              onToggleMode={() => setIsLogin(true)}
              redirectTo="/"
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
