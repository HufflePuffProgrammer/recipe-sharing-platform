"use client";

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { UserMenu } from '@/app/components/auth/UserMenu';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ProfileEditLoading } from '@/app/components/ui/loading';
import { ChefHat, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
}

function ProfileEditContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    username: '',
    full_name: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          setError('Profile not found. Please contact support.');
        } else {
          setError('Failed to load profile for editing.');
        }
        return;
      }

      setProfile(data);
      setFormData({
        username: data.username || '',
        full_name: data.full_name || ''
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while loading your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Validate inputs
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required');
      }

      if (formData.username && formData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      console.log('Updating profile:', formData);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim() || null,
          full_name: formData.full_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        if (error.code === '23505') {
          throw new Error('This username is already taken. Please choose a different one.');
        }
        throw new Error('Failed to update profile. Please try again.');
      }

      console.log('Profile updated successfully:', data);
      setSuccess('Profile updated successfully!');

      // Redirect to profile page after a brief delay
      setTimeout(() => {
        router.push('/profile');
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
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    Profile
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Edit Profile</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/profile')} className="bg-orange-600 hover:bg-orange-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
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
                <button
                  onClick={() => router.push('/profile')}
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Profile
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
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Profile
            </h1>
            <p className="text-gray-600">
              Update your profile information
            </p>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information. Your email address is managed separately.
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

                  {/* Current Email Display */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Email address cannot be changed here. Contact support if needed.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500">
                      This is the name that will be displayed on your recipes and profile.
                    </p>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Choose a unique username"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500">
                      Usernames must be at least 3 characters and can only contain letters, numbers, and underscores.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving ? 'Updating Profile...' : 'Update Profile'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/profile')}
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

export default function EditProfilePage() {
  return (
    <Suspense fallback={<ProfileEditLoading />}>
      <ProfileEditContent />
    </Suspense>
  );
}
