-- ========================================
-- DATABASE SETUP VERIFICATION TESTS
-- Run this after completing the database setup
-- ========================================

-- Test 1: Check all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites');

    IF table_count = 5 THEN
        RAISE NOTICE '✅ All core tables created successfully!';
    ELSE
        RAISE NOTICE '❌ Missing tables. Found: %', table_count;
    END IF;
END $$;

-- Test 2: Check RLS is enabled
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites')
    AND c.relrowsecurity = true;

    IF rls_count = 5 THEN
        RAISE NOTICE '✅ Row Level Security enabled on all tables!';
    ELSE
        RAISE NOTICE '❌ RLS not properly configured. Enabled: %', rls_count;
    END IF;
END $$;

-- Test 3: Check policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites');

    IF policy_count >= 10 THEN
        RAISE NOTICE '✅ Security policies created! Total policies: %', policy_count;
    ELSE
        RAISE NOTICE '❌ Insufficient policies. Found: %', policy_count;
    END IF;
END $$;

-- Test 4: Check trigger exists
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth'
        AND c.relname = 'users'
        AND t.tgname = 'on_auth_user_created'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        RAISE NOTICE '✅ Automatic profile creation trigger is active!';
    ELSE
        RAISE NOTICE '❌ Profile creation trigger missing!';
    END IF;
END $$;

-- Test 5: Check indexes exist
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    IF index_count >= 6 THEN
        RAISE NOTICE '✅ Performance indexes created! Total: %', index_count;
    ELSE
        RAISE NOTICE '❌ Insufficient indexes. Found: %', index_count;
    END IF;
END $$;

-- ========================================
-- SUMMARY REPORT
-- ========================================

DO $$
DECLARE
    table_count INTEGER;
    rls_count INTEGER;
    policy_count INTEGER;
    trigger_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites');

    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites')
    AND c.relrowsecurity = true;

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'recipes', 'recipe_ratings', 'recipe_comments', 'recipe_favorites');

    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
    ) INTO trigger_exists;

    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

    -- Report
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 DATABASE SETUP VERIFICATION REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Core Tables: %/5', table_count;
    RAISE NOTICE '🔒 RLS Enabled: %/5', rls_count;
    RAISE NOTICE '📋 Security Policies: %', policy_count;
    RAISE NOTICE '🔄 Auto Profile Trigger: %', CASE WHEN trigger_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '⚡ Performance Indexes: %', index_count;
    RAISE NOTICE '========================================';

    IF table_count = 5 AND rls_count = 5 AND policy_count >= 10 AND trigger_exists AND index_count >= 6 THEN
        RAISE NOTICE '🎉 DATABASE SETUP: COMPLETE!';
        RAISE NOTICE '🚀 Ready for user registration and recipe sharing!';
    ELSE
        RAISE NOTICE '⚠️  DATABASE SETUP: INCOMPLETE';
        RAISE NOTICE '📖 Check DATABASE_SETUP_README.md for troubleshooting';
    END IF;
END $$;
