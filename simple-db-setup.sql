-- ========================================
-- SIMPLE RECIPE PLATFORM DATABASE SETUP
-- Creates just 2 tables: profiles and recipes
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. PROFILES TABLE
-- ========================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. RECIPES TABLE
-- ========================================
CREATE TABLE public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL, -- JSON string or comma-separated
    instructions TEXT NOT NULL,
    cooking_time INTEGER, -- minutes
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT, -- breakfast, lunch, dinner, dessert, etc.
    is_published BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX idx_recipes_category ON public.recipes(category);
CREATE INDEX idx_recipes_difficulty ON public.recipes(difficulty);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Anyone can view published recipes" ON public.recipes
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert their own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- AUTOMATIC PROFILE CREATION
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- UPDATED_AT TRIGGER
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipes
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Simple database setup completed!';
    RAISE NOTICE '📊 Created 2 core tables: profiles, recipes';
    RAISE NOTICE '🔒 Enabled RLS with proper policies';
    RAISE NOTICE '🔄 Set up automatic profile creation';
    RAISE NOTICE '⚡ Added performance indexes';
    RAISE NOTICE '🚀 Ready for basic recipe sharing!';
END $$;
