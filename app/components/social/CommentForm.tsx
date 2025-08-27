"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

interface CommentFormProps {
  recipeId: string;
  editComment?: Comment;
  onCommentAdded: () => void;
  onCancel: () => void;
}

export function CommentForm({
  recipeId,
  editComment,
  onCommentAdded,
  onCancel
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isEditing = !!editComment;
  const maxLength = 1000;

  useEffect(() => {
    if (editComment) {
      setContent(editComment.content);
    }
  }, [editComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validation
      if (!content.trim()) {
        throw new Error('Comment cannot be empty');
      }

      if (content.length > maxLength) {
        throw new Error(`Comment must be ${maxLength} characters or less`);
      }

      if (!user?.id) {
        throw new Error('You must be logged in to comment');
      }

      if (isEditing) {
        // Update existing comment
        const { error } = await supabase
          .from('recipe_comments')
          .update({
            content: content.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editComment.id)
          .eq('user_id', user.id); // Double check ownership

        if (error) {
          console.error('Error updating comment:', error);
          throw new Error('Failed to update comment. Please try again.');
        }

        console.log(`User ${user.id} updated comment ${editComment.id}`);
      } else {
        // Create new comment
        const { error } = await supabase
          .from('recipe_comments')
          .insert({
            recipe_id: recipeId,
            user_id: user.id,
            content: content.trim()
          });

        if (error) {
          console.error('Error creating comment:', error);
          throw new Error('Failed to add comment. Please try again.');
        }

        console.log(`User ${user.id} added comment to recipe ${recipeId}`);
      }

      setContent('');
      onCommentAdded();
    } catch (err) {
      console.error('Comment form error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="comment-content">
          {isEditing ? 'Edit Comment' : 'Add a Comment'} *
        </Label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isEditing ? "Update your comment..." : "Share your thoughts on this recipe..."}
          className="min-h-[100px] resize-none"
          disabled={saving}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            {!user?.id && "Please log in to comment"}
            {user?.id && `${content.length}/${maxLength} characters`}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          onClick={handleCancel}
          variant="outline"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || !content.trim() || !user?.id}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving
            ? (isEditing ? 'Updating...' : 'Posting...')
            : (isEditing ? 'Update Comment' : 'Post Comment')
          }
        </Button>
      </div>
    </form>
  );
}
