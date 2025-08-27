# Supabase Setup Guide - Fix "Database error saving new user"

This guide will help you fix the "Database error saving new user" error that occurs during user registration.

## 🚨 Problem

You're getting this error when trying to sign up:
```
AuthApiError: Database error saving new user
```

## 🔧 Root Cause

This error occurs because Supabase Auth is trying to save user data to the `auth.users` table, but there are configuration issues with:

1. **Database Schema**: The auth schema might not be properly initialized
2. **Row Level Security (RLS)**: Policies might be blocking user creation
3. **Project Configuration**: Auth settings might not be properly configured

## 📋 Step-by-Step Fix

### Step 1: Verify Supabase Project Setup

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Check the following**:

#### A. Authentication Settings
1. Go to **Authentication → Settings**
2. Verify:
   - **Site URL**: Should match your app's domain (e.g., `http://localhost:3000` for development)
   - **Redirect URLs**: Should include your auth callback URLs
   - **JWT Expiry**: Default settings are usually fine

#### B. Database Tables
1. Go to **SQL Editor**
2. Run this query to check if auth tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;
```

You should see tables like:
- `users`
- `sessions`
- `refresh_tokens`
- `instances`
- `audit_log_entries`

### Step 2: Check Row Level Security Policies

1. Go to **Database → Tables**
2. Look for the `auth.users` table
3. Click on it and check the **Policies** tab
4. You should see policies that allow:
   - Authenticated users to read their own data
   - The auth service to insert new users

### Step 3: Reset Auth (If Needed)

If the above checks fail, you may need to reset the auth setup:

1. Go to **SQL Editor**
2. Run this command:

```sql
-- This will recreate the auth schema with default settings
SELECT auth.reset_auth();
```

⚠️ **WARNING**: This will delete all existing users and auth data. Only do this in development!

### Step 4: Test with a Simple Query

After fixing the setup, test that the auth system can connect:

1. Go to **SQL Editor**
2. Run:

```sql
-- Test auth schema access
SELECT * FROM auth.users LIMIT 1;
```

## 🔍 Alternative Solutions

### Option A: Disable RLS Temporarily (Development Only)

```sql
-- Disable RLS on auth.users for testing (NOT for production!)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
```

### Option B: Check Supabase Status

Visit: https://status.supabase.com/
- Ensure there are no ongoing incidents

### Option C: Environment Variables

Double-check your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🧪 Testing the Fix

1. **Clear browser cache/cookies** for the site
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Try signing up** with a new email address
4. **Check browser console** for detailed error messages

## 📞 Getting Help

If the above steps don't work:

1. **Check Supabase Dashboard → Settings → General**
   - Ensure your project is active
   - Check for any error messages

2. **Contact Supabase Support**:
   - Go to Supabase Dashboard → Help → Contact Support
   - Provide your project details and the exact error

3. **Community Resources**:
   - Supabase Discord: https://discord.supabase.com/
   - GitHub Issues: https://github.com/supabase/supabase-js/issues

## 🚀 Next Steps

Once authentication is working:

1. **Set up email confirmation** (optional but recommended)
2. **Create user profiles** table for additional user data
3. **Implement password reset** functionality
4. **Add social auth providers** (Google, GitHub, etc.)

---

**Quick Fix Checklist:**
- [ ] Verify Supabase project is active
- [ ] Check auth settings (Site URL, Redirect URLs)
- [ ] Test database connectivity
- [ ] Clear browser cache
- [ ] Restart development server
- [ ] Try signing up again
