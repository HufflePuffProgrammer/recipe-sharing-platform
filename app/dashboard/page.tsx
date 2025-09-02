"use client";

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLoading } from '@/app/components/ui/loading';
import { ChefHat, Clock, User, Plus, Star, Search, X, Heart } from 'lucide-react';
import { LikeButton } from '@/app/components/social/LikeButton';
import { CommentCount } from '@/app/components/social/CommentCount';
import { useRouter, useSearchParams } from 'next/navigation';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  category: string;
  created_at: string;
  user_id: string;
  is_published: boolean;
  author_name?: string;
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    fetchRecipes();
    // Clean up the refresh parameter from URL after fetching
    if (searchParams.get('refresh')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams.get('refresh'), searchQuery]); // Re-fetch when refresh param changes or search query changes

  const fetchRecipes = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          cooking_time,
          difficulty,
          category,
          created_at,
          user_id,
          is_published
        `)
        .eq('is_published', true);

      // Add search functionality if search query exists
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%,ingredients.ilike.%${searchQuery.trim()}%,category.ilike.%${searchQuery.trim()}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50); // Increased limit for search results

      if (error) {
        console.error('Error fetching recipes:', error);
        setError('Failed to load recipes');
      } else {
        // Fetch author names for each recipe
        const recipesWithAuthors = await Promise.all(
          (data || []).map(async (recipe) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', recipe.user_id)
                .single();

              return {
                ...recipe,
                author_name: profile?.full_name || profile?.username || 'Anonymous Chef'
              };
            } catch (err) {
              console.error('Error fetching author for recipe:', recipe.id, err);
              return {
                ...recipe,
                author_name: 'Anonymous Chef'
              };
            }
          })
        );

        setRecipes(recipesWithAuthors);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold text-gray-900">Galley</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-orange-600 font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/recipes/create')}
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Create Recipe
                </button>
              </nav>
              <div className="flex items-center space-x-4">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Discover amazing recipes from our community - including your own!
            </p>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/recipes/create')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share Your Recipe
              </Button>
              <Button
                onClick={() => router.push('/saved')}
                variant="outline"
                className="px-6 py-2"
              >
                <Heart className="w-4 h-4 mr-2" />
                Saved Recipes
              </Button>
              <Button
                onClick={fetchRecipes}
                variant="outline"
                disabled={loading}
                className="px-6 py-2"
              >
                Refresh Recipes
              </Button>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search recipes by title, description, ingredients, or category..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Searching for {searchQuery}..
                </p>
              )}
            </div>
          </div>

          {/* Recipes Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchRecipes} variant="outline">
                Try Again
              </Button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No recipes found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No recipes match your search for {searchQuery}.
                  </p>
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="mr-2"
                  >
                    Clear Search
                  </Button>
                  <Button
                    onClick={() => router.push('/recipes/create')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Recipe
                  </Button>
                </>
              ) : (
                <>
                  <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No recipes yet!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to share a recipe with the community.
                  </p>
                  <Button
                    onClick={() => router.push('/recipes/create')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Recipe
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-600">
                    Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for &quot{searchQuery}&quot
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {recipe.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {recipe.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Author and Date */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{recipe.author_name || 'Anonymous Chef'}</span>
                        </div>
                        <span>{formatDate(recipe.created_at)}</span>
                      </div>

                      {/* Recipe Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{recipe.cooking_time} mins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                            {recipe.difficulty}
                          </span>
                          <LikeButton
                            recipeId={recipe.id}
                            size="sm"
                            showCount={true}
                          />
                          <CommentCount
                            recipeId={recipe.id}
                            showIcon={true}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      {recipe.category && (
                        <div className="text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {recipe.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </>
          )}
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
    </AuthGuard>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
