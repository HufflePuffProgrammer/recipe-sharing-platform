"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ChefHat, ArrowLeft, Loader2 } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cooking_time: number;
  difficulty: string;
  category: string;
  user_id: string;
  is_published: boolean;
}

export default function EditRecipePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    cooking_time: '',
    difficulty: 'easy',
    category: '',
    is_published: true
  });

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
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id) // Ensure user can only edit their own recipes
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        if (error.code === 'PGRST116') {
          setError('Recipe not found or you do not have permission to edit it.');
        } else {
          setError('Failed to load recipe for editing.');
        }
        return;
      }

      setRecipe(data);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        ingredients: data.ingredients || '',
        instructions: data.instructions || '',
        cooking_time: data.cooking_time?.toString() || '',
        difficulty: data.difficulty || 'easy',
        category: data.category || '',
        is_published: data.is_published ?? true
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while loading the recipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Recipe title is required');
      }
      if (!formData.ingredients.trim()) {
        throw new Error('Ingredients are required');
      }
      if (!formData.instructions.trim()) {
        throw new Error('Instructions are required');
      }

      const cookingTime = parseInt(formData.cooking_time);
      if (isNaN(cookingTime) || cookingTime <= 0) {
        throw new Error('Please enter a valid cooking time in minutes');
      }

      console.log('Updating recipe:', formData);

      const { data, error } = await supabase
        .from('recipes')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          ingredients: formData.ingredients.trim(),
          instructions: formData.instructions.trim(),
          cooking_time: cookingTime,
          difficulty: formData.difficulty,
          category: formData.category.trim() || null,
          is_published: formData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id) // Double check ownership
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update recipe. Please try again.');
      }

      console.log('Recipe updated successfully:', data);
      setSuccess('Recipe updated successfully!');

      // Redirect to recipe detail page after a brief delay
      setTimeout(() => {
        router.push(`/recipes/${id}`);
      }, 1500);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSaving(false);
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

  if (error) {
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Edit Recipe</h1>
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
          {/* Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/recipes/${id}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Recipe
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Recipe
            </h1>
            <p className="text-gray-600">
              Make changes to your recipe
            </p>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Edit Recipe Details</CardTitle>
                <CardDescription>
                  Update your recipe information. All fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Recipe Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Grandma's Chocolate Chip Cookies"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of your recipe..."
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={saving}
                    />
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients *</Label>
                    <textarea
                      id="ingredients"
                      name="ingredients"
                      value={formData.ingredients}
                      onChange={handleInputChange}
                      placeholder="List your ingredients, one per line..."
                      className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions *</Label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      placeholder="Step-by-step cooking instructions..."
                      className="flex min-h-[150px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Cooking Time and Difficulty Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cooking_time">Cooking Time (minutes) *</Label>
                      <Input
                        id="cooking_time"
                        name="cooking_time"
                        type="number"
                        value={formData.cooking_time}
                        onChange={handleInputChange}
                        placeholder="e.g., 45"
                        min="1"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty *</Label>
                      <select
                        id="difficulty"
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={saving}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      type="text"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g., breakfast, dinner, dessert..."
                      disabled={saving}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving ? 'Updating Recipe...' : 'Update Recipe'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/recipes/${id}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
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
    </AuthGuard>
  );
}
