-- =============================================
-- SOCIAL FEATURES: LIKES AND COMMENTS
-- =============================================

-- =============================================
-- RECIPE LIKES TABLE
-- =============================================

-- Create recipe_likes table
CREATE TABLE IF NOT EXISTS recipe_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate likes from same user on same recipe
    UNIQUE(recipe_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe_id ON recipe_likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_likes_user_id ON recipe_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_likes_created_at ON recipe_likes(created_at);

-- =============================================
-- RECIPE COMMENTS TABLE
-- =============================================

-- Create recipe_comments table
CREATE TABLE IF NOT EXISTS recipe_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 1000), -- Max 1000 characters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_created_at ON recipe_comments(created_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on both tables
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RECIPE LIKES POLICIES
-- =============================================

-- Policy: Users can view all likes
CREATE POLICY "Anyone can view likes" ON recipe_likes
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own likes
CREATE POLICY "Users can like recipes" ON recipe_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can unlike recipes" ON recipe_likes
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RECIPE COMMENTS POLICIES
-- =============================================

-- Policy: Anyone can view comments on published recipes
CREATE POLICY "Anyone can view comments on published recipes" ON recipe_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_comments.recipe_id
            AND recipes.is_published = true
        )
    );

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can comment on recipes" ON recipe_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can edit their own comments" ON recipe_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON recipe_comments
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get like count for a recipe
CREATE OR REPLACE FUNCTION get_recipe_like_count(recipe_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM recipe_likes
    WHERE recipe_id = recipe_uuid;
$$;

-- Function to check if user has liked a recipe
CREATE OR REPLACE FUNCTION has_user_liked_recipe(recipe_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM recipe_likes
        WHERE recipe_id = recipe_uuid AND user_id = user_uuid
    );
$$;

-- Function to get comment count for a recipe
CREATE OR REPLACE FUNCTION get_recipe_comment_count(recipe_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM recipe_comments
    WHERE recipe_id = recipe_uuid;
$$;

-- =============================================
-- UPDATE RECIPES TABLE WITH COUNTS
-- =============================================

-- Add computed columns for like and comment counts (optional)
-- These will be calculated on-the-fly for better performance

-- Note: In a production app, you might want to add these as regular columns
-- and update them with triggers, but for simplicity, we'll use functions.

-- =============================================
-- TEST DATA (Optional)
-- =============================================

-- You can uncomment and modify these to add test data

/*
-- Add some test likes
INSERT INTO recipe_likes (recipe_id, user_id) VALUES
    ('your-recipe-id-1', 'your-user-id-1'),
    ('your-recipe-id-2', 'your-user-id-2');

-- Add some test comments
INSERT INTO recipe_comments (recipe_id, user_id, content) VALUES
    ('your-recipe-id-1', 'your-user-id-1', 'This recipe looks amazing!'),
    ('your-recipe-id-2', 'your-user-id-2', 'Great instructions, very clear.');
*/

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Social features setup completed successfully!';
    RAISE NOTICE 'Created tables: recipe_likes, recipe_comments';
    RAISE NOTICE 'Added RLS policies for security';
    RAISE NOTICE 'Created helper functions for counts and checks';
END $$;