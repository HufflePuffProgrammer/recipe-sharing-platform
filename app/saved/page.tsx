"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { SavedLoading } from '@/app/components/ui/loading';
import { LikeButton } from '@/app/components/social/LikeButton';
import { CommentCount } from '@/app/components/social/CommentCount';
import { ChefHat, Clock, User, ArrowLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  author_name: string;
}

export default function SavedRecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      fetchSavedRecipes();
    }
  }, [user?.id]);

  const fetchSavedRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recipes that the user has liked
      const { data: likes, error: likesError } = await supabase
        .from('recipe_likes')
        .select('recipe_id')
        .eq('user_id', user?.id);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        setError('Failed to load saved recipes');
        return;
      }

      if (!likes || likes.length === 0) {
        setRecipes([]);
        return;
      }

      const recipeIds = likes.map(like => like.recipe_id);

      // Fetch the actual recipe data
      const { data: recipeData, error: recipesError } = await supabase
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
        .in('id', recipeIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (recipesError) {
        console.error('Error fetching recipes:', recipesError);
        setError('Failed to load saved recipes');
        return;
      }

      // Fetch author names for each recipe
      const recipesWithAuthors = await Promise.all(
        (recipeData || []).map(async (recipe) => {
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
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <AuthGuard>
        <SavedLoading />
      </AuthGuard>
    );
  }

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
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/recipes/create')}
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Create Recipe
                </button>
                <span className="text-orange-600 font-medium">Saved Recipes</span>
              </nav>
              <div className="flex items-center space-x-4">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-red-600 fill-current" />
              <h1 className="text-4xl font-bold text-gray-900">
                Your Saved Recipes
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Recipes you've liked and want to keep for later
            </p>
          </div>

          {/* Content */}
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSavedRecipes} variant="outline">
                Try Again
              </Button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No saved recipes yet!
              </h3>
              <p className="text-gray-600 mb-4">
                Start exploring and liking recipes to save them here.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Browse Recipes
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  You have {recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}
                </p>
              </div>

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
                            <span>{recipe.author_name}</span>
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
                          </div>
                        </div>

                        {/* Social Actions */}
                        <div className="flex items-center justify-between pt-2">
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
