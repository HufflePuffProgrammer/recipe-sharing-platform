-- ========================================
-- SIMPLE DATABASE VERIFICATION
-- Test the basic 2-table setup
-- ========================================

-- Test 1: Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'recipes')
ORDER BY table_name;

-- Test 2: Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'recipes');

-- Test 3: Check policies exist
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'recipes')
ORDER BY tablename, policyname;

-- Test 4: Check trigger exists
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Test 5: Check indexes exist
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- SUMMARY
-- ========================================
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    trigger_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'recipes');

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'recipes');

    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
        AND event_object_table = 'users'
        AND trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;

    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 SIMPLE DATABASE VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Tables Created: %/2', table_count;
    RAISE NOTICE '📋 Security Policies: %', policy_count;
    RAISE NOTICE '🔄 Auto Profile Trigger: %', CASE WHEN trigger_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '⚡ Performance Indexes: %', index_count;
    RAISE NOTICE '========================================';

    IF table_count = 2 AND policy_count >= 6 AND trigger_exists THEN
        RAISE NOTICE '🎉 BASIC SETUP: COMPLETE!';
        RAISE NOTICE '🚀 Ready for user registration and recipes!';
    ELSE
        RAISE NOTICE '⚠️  SETUP: INCOMPLETE';
        RAISE NOTICE '📖 Run simple-db-setup.sql in Supabase SQL Editor';
    END IF;
END $$;
