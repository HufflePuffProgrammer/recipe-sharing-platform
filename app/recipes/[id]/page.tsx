"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { RecipeDetailLoading } from '@/app/components/ui/loading';
import { ChefHat, Clock, User, ArrowLeft, Edit, Star, Trash2 } from 'lucide-react';
import { LikeButton } from '@/app/components/social/LikeButton';
import { CommentSection } from '@/app/components/social/CommentSection';
import { CommentCount } from '@/app/components/social/CommentCount';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cooking_time: number;
  difficulty: string;
  category: string;
  created_at: string;
  user_id: string;
  is_published: boolean;
  author_name: string;
}

function RecipeDetailContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          ingredients,
          instructions,
          cooking_time,
          difficulty,
          category,
          created_at,
          user_id,
          is_published
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        setError('Recipe not found or not available');
        return;
      }

      // Fetch author name
      let author_name = 'Anonymous Chef';
      if (data?.user_id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', data.user_id)
            .single();

          author_name = profile?.full_name || profile?.username || 'Anonymous Chef';
        } catch (err) {
          console.error('Error fetching author:', err);
        }
      }

      setRecipe({
        ...data,
        author_name
      });
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatIngredients = (ingredients: string) => {
    return ingredients.split('\n').filter(line => line.trim());
  };

  const formatInstructions = (instructions: string) => {
    return instructions.split('\n').filter(line => line.trim());
  };

  const handleDelete = async () => {
    if (!recipe) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id)
        .eq('user_id', user?.id); // Double check ownership

      if (error) {
        console.error('Error deleting recipe:', error);
        setError('Failed to delete recipe. Please try again.');
        return;
      }

      // Redirect to dashboard after successful deletion
      router.push('/dashboard?refresh=' + Date.now());
    } catch (err) {
      console.error('Unexpected error during deletion:', err);
      setError('An unexpected error occurred while deleting the recipe.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    if (recipe) {
      router.push(`/recipes/${recipe.id}/edit`);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !recipe) {
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
                </nav>
                <div className="flex items-center space-x-4">
                  <UserMenu />
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')} className="bg-orange-600 hover:bg-orange-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
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
              </nav>
              <div className="flex items-center space-x-4">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Recipe Content */}
          <div className="max-w-4xl mx-auto">
            {/* Recipe Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>

                          {/* Recipe Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-gray-600">
                <User className="w-4 h-4" />
                <span>{recipe.author_name}</span>
              </div>

              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{recipe.cooking_time} minutes</span>
              </div>

              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(recipe.difficulty)}`}>
                {recipe.difficulty}
              </span>

              {recipe.category && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {recipe.category}
                </span>
              )}

              <LikeButton
                recipeId={recipe.id}
                size="default"
                showCount={true}
              />

              <CommentCount
                recipeId={recipe.id}
                showIcon={true}
                className="text-gray-700"
              />
            </div>

              <p className="text-gray-600 text-lg">{recipe.description}</p>
            </div>

            {/* Recipe Details */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-orange-600">Ingredients</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {formatIngredients(recipe.ingredients).map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-orange-600">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {formatInstructions(recipe.instructions).map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Recipe Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Created on {formatDate(recipe.created_at)}
                </div>

                {user?.id === recipe.user_id && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Recipe
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Recipe
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <CommentSection recipeId={recipe.id} />
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Recipe
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {recipe?.title}? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleting}
                  className="flex items-center gap-2"
                >
                  {deleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {deleting ? 'Deleting...' : 'Delete Recipe'}
                </Button>
              </div>
            </div>
          </div>
        )}

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

export default function RecipeDetailPage() {
  return (
    <Suspense fallback={<RecipeDetailLoading />}>
      <RecipeDetailContent />
    </Suspense>
  );
}
