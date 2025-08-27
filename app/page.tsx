"use client";

import { ChefHat } from "lucide-react";
import SupabaseConnectionTest from "./components/SupabaseConnectionTest";
import { UserMenu } from "./components/auth/UserMenu";
import { Button } from "./components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";



export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Supabase Connection Test */}
      <SupabaseConnectionTest />
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">Galley</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                Browse Recipes
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                How it Works
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                About
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Focused on Authentication */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <ChefHat className="h-20 w-20 text-orange-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-orange-600">Galley</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            The modern recipe sharing platform for home cooks. Share your favorite recipes,
            discover new dishes, and connect with fellow cooking enthusiasts.
          </p>

          {/* Authentication CTA */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Start Your Cooking Journey
            </h2>
            <p className="text-gray-600 mb-6">
              Join our community and share your culinary creations with the world.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/auth')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
              >
                Start Creating Recipes
              </Button>
              <p className="text-sm text-gray-500">
                Already have an account? <button onClick={() => router.push('/auth')} className="text-orange-600 hover:text-orange-700 font-medium underline">Sign in here</button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <ChefHat className="h-8 w-8 text-orange-400" />
          </div>
          <p className="text-gray-400">
            © 2024 Galley. Made with ❤️ for home cooks everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}