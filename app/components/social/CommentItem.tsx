"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Edit, Trash2, MoreVertical, Check, X } from 'lucide-react';
import { CommentForm } from './CommentForm';

interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
}

export function CommentItem({
  comment,
  currentUserId,
  onCommentUpdated,
  onCommentDeleted
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from('recipe_comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUserId); // Double check ownership

      if (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
        return;
      }

      onCommentDeleted();
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      alert('An unexpected error occurred while deleting the comment.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isOwner = currentUserId === comment.user_id;

  return (
    <Card>
      <CardContent className="pt-4">
        {isEditing ? (
          <CommentForm
            recipeId={comment.recipe_id}
            editComment={comment}
            onCommentAdded={onCommentUpdated}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-3">
            {/* Comment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {comment.author_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>

              {/* Comment Actions */}
              {isOwner && (
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Comment Content */}
            <div className="pl-11">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Comment
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleting}
                  className="flex items-center gap-2"
                >
                  {deleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {deleting ? 'Deleting...' : 'Delete Comment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
