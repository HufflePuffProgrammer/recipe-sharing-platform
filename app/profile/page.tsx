"use client";

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ProfileLoading } from '@/app/components/ui/loading';
import { ChefHat, User, Calendar, Edit, Plus, Clock, Star } from 'lucide-react';
import { LikeButton } from '@/app/components/social/LikeButton';
import { CommentCount } from '@/app/components/social/CommentCount';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  category: string;
  created_at: string;
  is_published: boolean;
}

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchUserRecipes();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, description, cooking_time, difficulty, category, created_at, is_published')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user recipes:', error);
        setError('Failed to load recipes');
        return;
      }

      setRecipes(data || []);
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
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecipeStats = () => {
    const total = recipes.length;
    const published = recipes.filter(r => r.is_published).length;
    const draft = total - published;

    return { total, published, draft };
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

  const stats = getRecipeStats();

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
                <span className="text-orange-600 font-medium">Profile</span>
              </nav>
              <div className="flex items-center space-x-4">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl font-bold text-gray-900">Your Profile</h1>
              <Button
                onClick={() => router.push('/profile/edit')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Profile Card */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <User className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.full_name || profile?.username || 'Anonymous Chef'}
                    </h2>
                    <div className="text-gray-600 space-y-1">
                      {profile?.username && profile?.full_name && profile.username !== profile.full_name && (
                        <p>@{profile.username}</p>
                      )}
                      <p className="text-sm">
                        Member since {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <ChefHat className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Recipes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                    <p className="text-sm text-gray-600">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Edit className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                    <p className="text-sm text-gray-600">Drafts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your Recipes Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Recipes</h2>
              <Button
                onClick={() => router.push('/recipes/create')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Recipe
              </Button>
            </div>

            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => { fetchUserRecipes(); setError(null); }} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No recipes yet!
                </h3>
                <p className="text-gray-600 mb-4">
                  Start sharing your favorite recipes with the community.
                </p>
                <Button
                  onClick={() => router.push('/recipes/create')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Recipe
                </Button>
              </div>
            ) : (
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
                        {!recipe.is_published && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {recipe.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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

                        {recipe.category && (
                          <div className="text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {recipe.category}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Created {formatDate(recipe.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}
