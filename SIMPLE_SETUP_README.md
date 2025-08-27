# 🗄️ Simple Recipe Platform Database Setup

## 🎯 What This Creates

Just **2 tables** for a basic recipe sharing platform:

### 1. Profiles Table
```sql
- id (UUID) - Links to Supabase auth.users
- username (TEXT) - Unique username
- full_name (TEXT) - User's display name
- created_at (TIMESTAMP) - Auto-generated
- updated_at (TIMESTAMP) - Auto-updated
```

### 2. Recipes Table
```sql
- id (UUID) - Auto-generated unique ID
- created_at (TIMESTAMP) - Auto-generated
- user_id (UUID) - Links to profiles table
- title (TEXT) - Recipe name
- ingredients (TEXT) - Ingredients list
- instructions (TEXT) - Cooking steps
- cooking_time (INTEGER) - Minutes to cook
- difficulty (TEXT) - 'easy', 'medium', or 'hard'
- category (TEXT) - 'breakfast', 'lunch', 'dinner', etc.
- is_published (BOOLEAN) - Public/private recipe
- updated_at (TIMESTAMP) - Auto-updated
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"**

### Step 2: Run Setup Script
1. Copy all content from **`simple-db-setup.sql`**
2. Paste into SQL Editor
3. Click **"Run"**

**Expected Output:**
```
✅ Simple database setup completed!
📊 Created 2 core tables: profiles, recipes
🔒 Enabled RLS with proper policies
🔄 Set up automatic profile creation
⚡ Added performance indexes
🚀 Ready for basic recipe sharing!
```

### Step 3: Verify Setup
1. Copy content from **`simple-test.sql`**
2. Paste into SQL Editor
3. Click **"Run"**

**Expected Output:**
```
🧪 SIMPLE DATABASE VERIFICATION
========================================
📊 Tables Created: 2/2
📋 Security Policies: 6+
🔄 Auto Profile Trigger: YES
⚡ Performance Indexes: 4+
========================================
🎉 BASIC SETUP: COMPLETE!
```

## 🔒 Security Features

- **Row Level Security (RLS)** enabled
- **Automatic profile creation** on user signup
- **Users can only edit their own data**
- **Public can view published recipes**

## 📊 Database Relationships

```
auth.users (Supabase built-in)
    ↓ (1:1)
public.profiles
    ↓ (1:many)
public.recipes
```

## 🧪 Test the Setup

1. **Sign up a new user** through your app
2. **Check profile created**:
   ```sql
   SELECT * FROM public.profiles;
   ```
3. **Create a test recipe** through your app
4. **View recipes**:
   ```sql
   SELECT * FROM public.recipes;
   ```

## 🎯 Features Enabled

✅ **User registration** with automatic profiles  
✅ **Recipe creation and management**  
✅ **Basic recipe sharing** (published recipes)  
✅ **Secure data access**  
✅ **Performance optimized**  

## 🚀 Next Steps

1. **Test user registration** through your `/auth` page
2. **Create recipe creation forms** in your app
3. **Build recipe display pages**
4. **Add image upload** for recipes
5. **Implement search and filtering**

---

**🎉 That's it! You now have a working database foundation for your recipe sharing app!**
