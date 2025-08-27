"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  recipeId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'default' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
}

export function LikeButton({
  recipeId,
  initialLikeCount = 0,
  initialIsLiked = false,
  size = 'default',
  showCount = true,
  variant = 'default',
  className
}: LikeButtonProps) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState(false);
  const [setupIncomplete, setSetupIncomplete] = useState(false);
  const supabase = createClient();

  // Size configurations
  const sizeConfigs = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
    default: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-2' },
    lg: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-4 py-3' }
  };

  const config = sizeConfigs[size];

  useEffect(() => {
    // Fetch real-time like data when component mounts
    if (user?.id) {
      fetchLikeStatus();
    }
    fetchLikeCount();
  }, [recipeId, user?.id]);

  // Check if social features tables exist
  const checkDatabaseSetup = async () => {
    try {
      const { error } = await supabase
        .from('recipe_likes')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        console.error('❌ Database setup incomplete!');
        console.log('📋 Please run the social-features-setup.sql file in your Supabase SQL editor');
        console.log('🔗 Go to: https://app.supabase.com -> Your Project -> SQL Editor');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking database setup:', error);
      return false;
    }
  };

  const fetchLikeStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('recipe_likes')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.error('❌ Database setup incomplete!');
          console.log('📋 Please run the social-features-setup.sql file in your Supabase SQL editor');
          setSetupIncomplete(true);
        } else {
          console.error('Error fetching like status:', error);
        }
        setIsLiked(false);
        return;
      }

      setIsLiked(!!data);
      console.log(`User ${user.id} ${data ? 'has liked' : 'has not liked'} recipe ${recipeId}`);
    } catch (error) {
      console.error('Error fetching like status:', error);
      setIsLiked(false);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const { count, error } = await supabase
        .from('recipe_likes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      if (error) {
        if (error.code === '42P01') {
          console.error('❌ Database setup incomplete!');
          console.log('📋 Please run the social-features-setup.sql file in your Supabase SQL editor');
          console.log('🔗 Go to: https://app.supabase.com -> Your Project -> SQL Editor');
          console.log('📄 Copy and paste the entire contents of social-features-setup.sql');
          setSetupIncomplete(true);
        } else {
          console.error('Error fetching like count:', error);
        }
        setLikeCount(0);
        return;
      }

      setLikeCount(count || 0);
      console.log(`✅ Like count for recipe ${recipeId}:`, count);
    } catch (error) {
      console.error('Error fetching like count:', error);
      setLikeCount(0);
    }
  };

  const handleLikeToggle = async () => {
    if (!user?.id) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }

    if (loading) return;

    setLoading(true);

    // Optimistic update
    const wasLiked = isLiked;
    const oldCount = likeCount;

    setIsLiked(!wasLiked);
    setLikeCount(wasLiked ? likeCount - 1 : likeCount + 1);
    setOptimisticUpdate(true);

    try {
      if (wasLiked) {
        // Unlike the recipe
        const { error } = await supabase
          .from('recipe_likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking recipe:', error);
          console.log('This likely means the recipe_likes table doesn\'t exist yet.');
          console.log('Please run the social-features-setup.sql file in your Supabase SQL editor first.');
          throw error;
        }
        console.log(`User ${user.id} unliked recipe ${recipeId}`);
      } else {
        // Like the recipe
        const { error } = await supabase
          .from('recipe_likes')
          .insert({
            recipe_id: recipeId,
            user_id: user.id
          });

        if (error) {
          console.error('Error liking recipe:', error);
          console.log('This likely means the recipe_likes table doesn\'t exist yet.');
          console.log('Please run the social-features-setup.sql file in your Supabase SQL editor first.');
          throw error;
        }
        console.log(`User ${user.id} liked recipe ${recipeId}`);
      }

      // Refresh like count after successful operation
      await fetchLikeCount();
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikeCount(oldCount);
      console.error('Like toggle failed:', error);
    } finally {
      setLoading(false);
      setOptimisticUpdate(false);
    }
  };

  const buttonContent = (
    <Button
      onClick={setupIncomplete ? () => {
        console.log('❌ Database setup incomplete! Please run the SQL setup first.');
        alert('Database setup incomplete! Please run the social-features-setup.sql file in your Supabase SQL editor first.');
      } : handleLikeToggle}
      disabled={loading || setupIncomplete}
      variant={variant === 'minimal' ? 'ghost' : isLiked ? 'default' : 'outline'}
      size="sm"
      className={cn(
        config.padding,
        setupIncomplete
          ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 cursor-not-allowed opacity-60'
          : isLiked
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-300'
          : 'hover:bg-gray-50',
        variant === 'minimal' && 'p-1 h-auto',
        className
      )}
    >
      {loading && !optimisticUpdate ? (
        <Loader2 className={cn('animate-spin', config.icon, 'mr-1')} />
      ) : (
        <Heart
          className={cn(
            config.icon,
            isLiked ? 'fill-current' : '',
            'mr-1'
          )}
        />
      )}
      {showCount && (
        <span className={config.text}>
          {likeCount}
        </span>
      )}
    </Button>
  );

  return buttonContent;
}
