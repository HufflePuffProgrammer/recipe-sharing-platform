-- ========================================
-- QUICK DATABASE SETUP FOR RECIPE PLATFORM
-- Run this in your Supabase SQL Editor (one section at a time)
-- ========================================

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create recipes table
CREATE TABLE public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    cuisine_type TEXT,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    dietary_restrictions TEXT[],
    ingredients JSONB NOT NULL DEFAULT '[]',
    nutrition_facts JSONB,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create essential supporting tables
CREATE TABLE public.recipe_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

CREATE TABLE public.recipe_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.recipe_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Step 5: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

-- Step 6: Create basic RLS policies
-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Recipes
CREATE POLICY "Anyone can view published recipes" ON public.recipes FOR SELECT USING (is_published = true);
CREATE POLICY "Users can insert their own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own recipes" ON public.recipes FOR DELETE USING (auth.uid() = author_id);

-- Ratings
CREATE POLICY "Anyone can view ratings" ON public.recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert ratings" ON public.recipe_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.recipe_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Anyone can view comments" ON public.recipe_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.recipe_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.recipe_comments FOR UPDATE USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY "Users can view their own favorites" ON public.recipe_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.recipe_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.recipe_favorites FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Add performance indexes
CREATE INDEX idx_recipes_author_id ON public.recipes(author_id);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN (tags);
CREATE INDEX idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_comments_recipe_id ON public.recipe_comments(recipe_id);
CREATE INDEX idx_recipe_favorites_user_id ON public.recipe_favorites(user_id);

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Quick database setup completed!';
    RAISE NOTICE '📊 Created core tables: profiles, recipes, ratings, comments, favorites';
    RAISE NOTICE '🔒 Enabled RLS with proper policies';
    RAISE NOTICE '🔄 Set up automatic profile creation';
    RAISE NOTICE '⚡ Added performance indexes';
    RAISE NOTICE '🚀 Ready for authentication testing!';
END $$;
