-- DIAGNOSTIC: Run this to see what policies actually exist
-- Copy the output and share it

-- 1. List all policies on groups table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'group_messages')
ORDER BY tablename, policyname;

-- 2. List all functions related to groups
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%group%' OR routine_name LIKE '%member%');

-- 3. Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('groups', 'group_members', 'group_messages');
