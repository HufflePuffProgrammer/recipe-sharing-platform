-- ========================================
-- Recipe Sharing Platform Database Setup
-- Run this in your Supabase SQL Editor
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. PROFILES TABLE (extends auth.users)
-- ========================================
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

-- ========================================
-- 2. RECIPES TABLE
-- ========================================
CREATE TABLE public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    servings INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    cuisine_type TEXT,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    dietary_restrictions TEXT[], -- array of restrictions
    ingredients JSONB NOT NULL DEFAULT '[]', -- array of ingredient objects
    nutrition_facts JSONB,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. RECIPE_IMAGES TABLE (for multiple images)
-- ========================================
CREATE TABLE public.recipe_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. RECIPE_RATINGS TABLE
-- ========================================
CREATE TABLE public.recipe_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id) -- one rating per user per recipe
);

-- ========================================
-- 5. RECIPE_COMMENTS TABLE
-- ========================================
CREATE TABLE public.recipe_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.recipe_comments(id) ON DELETE CASCADE, -- for replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. RECIPE_FAVORITES TABLE
-- ========================================
CREATE TABLE public.recipe_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id) -- one favorite per user per recipe
);

-- ========================================
-- 7. RECIPE_COLLECTIONS TABLE
-- ========================================
CREATE TABLE public.recipe_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 8. COLLECTION_RECIPES TABLE (junction table)
-- ========================================
CREATE TABLE public.collection_recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.recipe_collections(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, recipe_id)
);

-- ========================================
-- 9. USER_FOLLOWERS TABLE
-- ========================================
CREATE TABLE public.user_followers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- can't follow yourself
);

-- ========================================
-- 10. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'follow', 'like', 'comment', 'rating'
    title TEXT NOT NULL,
    message TEXT,
    data JSONB, -- additional data for the notification
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 11. SEARCH_HISTORY TABLE
-- ========================================
CREATE TABLE public.search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_recipes_author_id ON public.recipes(author_id);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN (tags);
CREATE INDEX idx_recipes_dietary_restrictions ON public.recipes USING GIN (dietary_restrictions);
CREATE INDEX idx_recipes_cuisine_type ON public.recipes(cuisine_type);
CREATE INDEX idx_recipes_meal_type ON public.recipes(meal_type);
CREATE INDEX idx_recipes_difficulty ON public.recipes(difficulty);

CREATE INDEX idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON public.recipe_ratings(user_id);

CREATE INDEX idx_recipe_comments_recipe_id ON public.recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_user_id ON public.recipe_comments(user_id);

CREATE INDEX idx_recipe_favorites_user_id ON public.recipe_favorites(user_id);
CREATE INDEX idx_recipe_favorites_recipe_id ON public.recipe_favorites(recipe_id);

CREATE INDEX idx_user_followers_follower_id ON public.user_followers(follower_id);
CREATE INDEX idx_user_followers_following_id ON public.user_followers(following_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES POLICIES
-- ========================================
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- RECIPES POLICIES
-- ========================================
CREATE POLICY "Anyone can view published recipes" ON public.recipes
    FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can view all recipes" ON public.recipes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = author_id);

-- ========================================
-- RECIPE IMAGES POLICIES
-- ========================================
CREATE POLICY "Anyone can view published recipe images" ON public.recipe_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_images.recipe_id
            AND recipes.is_published = true
        )
    );

CREATE POLICY "Users can manage their own recipe images" ON public.recipe_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_images.recipe_id
            AND recipes.author_id = auth.uid()
        )
    );

-- ========================================
-- RECIPE RATINGS POLICIES
-- ========================================
CREATE POLICY "Anyone can view ratings" ON public.recipe_ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON public.recipe_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.recipe_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.recipe_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- RECIPE COMMENTS POLICIES
-- ========================================
CREATE POLICY "Anyone can view comments" ON public.recipe_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.recipe_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.recipe_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.recipe_comments
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- RECIPE FAVORITES POLICIES
-- ========================================
CREATE POLICY "Users can view their own favorites" ON public.recipe_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON public.recipe_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.recipe_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- RECIPE COLLECTIONS POLICIES
-- ========================================
CREATE POLICY "Users can view public collections and their own" ON public.recipe_collections
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" ON public.recipe_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.recipe_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.recipe_collections
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- COLLECTION RECIPES POLICIES
-- ========================================
CREATE POLICY "Users can view public collection recipes and their own" ON public.collection_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipe_collections
            WHERE recipe_collections.id = collection_recipes.collection_id
            AND (recipe_collections.is_public = true OR recipe_collections.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own collection recipes" ON public.collection_recipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipe_collections
            WHERE recipe_collections.id = collection_recipes.collection_id
            AND recipe_collections.user_id = auth.uid()
        )
    );

-- ========================================
-- USER FOLLOWERS POLICIES
-- ========================================
CREATE POLICY "Anyone can view follower relationships" ON public.user_followers
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_followers
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_followers
    FOR DELETE USING (auth.uid() = follower_id);

-- ========================================
-- NOTIFICATIONS POLICIES
-- ========================================
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- SEARCH HISTORY POLICIES
-- ========================================
CREATE POLICY "Users can view their own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON public.search_history
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipes
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipe_ratings
    BEFORE UPDATE ON public.recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipe_comments
    BEFORE UPDATE ON public.recipe_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_recipe_collections
    BEFORE UPDATE ON public.recipe_collections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for recipes with author information and ratings
CREATE VIEW public.recipes_with_meta AS
SELECT
    r.*,
    p.full_name as author_name,
    p.avatar_url as author_avatar,
    COALESCE(AVG(rt.rating), 0) as average_rating,
    COUNT(rt.id) as total_ratings,
    COUNT(rf.id) as total_favorites
FROM public.recipes r
LEFT JOIN public.profiles p ON r.author_id = p.id
LEFT JOIN public.recipe_ratings rt ON r.id = rt.recipe_id
LEFT JOIN public.recipe_favorites rf ON r.id = rf.recipe_id
GROUP BY r.id, p.full_name, p.avatar_url;

-- View for user profiles with stats
CREATE VIEW public.profiles_with_stats AS
SELECT
    p.*,
    COUNT(DISTINCT r.id) as total_recipes,
    COUNT(DISTINCT uf1.id) as followers_count,
    COUNT(DISTINCT uf2.id) as following_count
FROM public.profiles p
LEFT JOIN public.recipes r ON p.id = r.author_id AND r.is_published = true
LEFT JOIN public.user_followers uf1 ON p.id = uf1.following_id
LEFT JOIN public.user_followers uf2 ON p.id = uf2.follower_id
GROUP BY p.id;

-- ========================================
-- INITIAL DATA (Optional)
-- ========================================

-- Insert some sample data (uncomment if wanted)
-- INSERT INTO public.profiles (id, email, full_name, bio)
-- VALUES
--     ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Recipe Admin', 'Official recipe curator');

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created 11 tables with proper RLS policies';
    RAISE NOTICE '🔍 Added performance indexes';
    RAISE NOTICE '🔄 Set up automatic profile creation trigger';
    RAISE NOTICE '👀 Created helpful database views';
    RAISE NOTICE '🔒 All tables have Row Level Security enabled';
END $$;
