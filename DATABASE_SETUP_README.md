# 🗄️ Recipe Sharing Platform - Database Setup

## 🎯 Overview

Your Supabase project needs a proper database schema to support the recipe sharing platform. This setup creates all necessary tables, security policies, and relationships.

## 📋 What This Setup Includes

### Core Tables:
- **profiles** - Extended user information
- **recipes** - Main recipe data with full details
- **recipe_ratings** - User ratings and reviews
- **recipe_comments** - Comments and replies system
- **recipe_favorites** - User's favorite recipes

### Security Features:
- **Row Level Security (RLS)** enabled on all tables
- **Proper access policies** for each user action
- **Automatic profile creation** when users sign up

### Performance Optimizations:
- **Strategic indexes** for fast queries
- **GIN indexes** for array fields (tags, dietary restrictions)
- **Foreign key relationships** for data integrity

## 🚀 Quick Setup (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Quick Setup Script
1. Copy the contents of `quick-db-setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

**Expected Output:**
```
✅ Quick database setup completed!
📊 Created core tables: profiles, recipes, ratings, comments, favorites
🔒 Enabled RLS with proper policies
🔄 Set up automatic profile creation
⚡ Added performance indexes
🚀 Ready for authentication testing!
```

## 🔧 Manual Step-by-Step Setup

If you prefer to run sections individually:

### Step 1: Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Create Core Tables
Run the table creation statements from `quick-db-setup.sql` (Steps 2-4)

### Step 3: Enable Security
Run the RLS statements from `quick-db-setup.sql` (Step 5)

### Step 4: Create Policies
Run the policy creation statements from `quick-db-setup.sql` (Step 6)

### Step 5: Add Triggers
Run the trigger creation statements from `quick-db-setup.sql` (Step 7)

### Step 6: Add Indexes
Run the index creation statements from `quick-db-setup.sql` (Step 8)

## 🧪 Testing the Setup

### Test 1: Check Tables Created
Run this in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- profiles
- recipes
- recipe_ratings
- recipe_comments
- recipe_favorites

### Test 2: Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test 3: Test Authentication
1. Try signing up a new user through your app
2. Check if a profile is automatically created:
```sql
SELECT * FROM public.profiles;
```

## 📊 Database Schema Overview

```
auth.users (Supabase built-in)
    ↓ (1:1 relationship)
public.profiles (extended user data)
    ↓ (1:many relationship)
public.recipes (user's recipes)
    ↓ (1:many relationships)
├── public.recipe_ratings
├── public.recipe_comments
└── public.recipe_favorites
```

## 🔒 Security Features

### Row Level Security Policies:
- **Public Read**: Anyone can view published recipes, ratings, comments
- **Owner Write**: Users can only modify their own data
- **Authenticated Access**: Some actions require login
- **Automatic Profile Creation**: Profiles created when users sign up

### Data Protection:
- **Foreign Key Constraints**: Maintains data integrity
- **Unique Constraints**: Prevents duplicate data
- **Check Constraints**: Validates data formats
- **Cascade Deletes**: Clean up related data

## 🚀 Advanced Features (Full Setup)

The `database-setup.sql` includes additional tables:
- **recipe_images** - Multiple images per recipe
- **recipe_collections** - User-created recipe collections
- **user_followers** - Follow system
- **notifications** - User notifications
- **search_history** - Search tracking

Run the full script if you want these features.

## 🐛 Troubleshooting

### Issue: "Table already exists"
**Solution:** Skip the table creation and run policies/indexes only

### Issue: "Policy already exists"
**Solution:** Drop existing policies first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Issue: Sign up still fails after setup
**Solution:** Check Supabase Auth settings:
1. Go to **Authentication → Settings**
2. Verify **Site URL** and **Redirect URLs**
3. Ensure email auth is enabled

### Issue: Can't see data in tables
**Solution:** Check RLS policies allow your user access

## 📞 Need Help?

1. **Check Supabase Status**: https://status.supabase.com/
2. **Supabase Community**: https://discord.supabase.com/
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

## 🎉 Next Steps

After running the database setup:

1. **Test user registration** through your app
2. **Create your first recipe** via the app
3. **Test ratings and comments** functionality
4. **Build additional features** using the database foundation

---

**🎯 Ready to start? Run the quick setup script and let your users begin sharing recipes!**
