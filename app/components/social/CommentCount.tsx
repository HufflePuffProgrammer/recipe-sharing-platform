"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle } from 'lucide-react';

interface CommentCountProps {
  recipeId: string;
  showIcon?: boolean;
  className?: string;
}

export function CommentCount({ recipeId, showIcon = true, className = '' }: CommentCountProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCommentCount();
  }, [recipeId]);

  const fetchCommentCount = async () => {
    try {
      setLoading(true);

      const { count, error } = await supabase
        .from('recipe_comments')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error fetching comment count:', error);
        setCommentCount(0);
        return;
      }

      setCommentCount(count || 0);
    } catch (error) {
      console.error('Error fetching comment count:', error);
      setCommentCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className={`text-gray-500 ${className}`}>
        {showIcon && <MessageCircle className="w-4 h-4 inline mr-1" />}
        ...
      </span>
    );
  }

  return (
    <span className={`text-gray-600 ${className}`}>
      {showIcon && <MessageCircle className="w-4 h-4 inline mr-1" />}
      {commentCount}
    </span>
  );
}
