"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CommentItem } from './CommentItem';
import { MessageCircle, Loader2 } from 'lucide-react';
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

interface CommentSectionProps {
  recipeId: string;
}

export function CommentSection({ recipeId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('recipe_comments')
        .select(`
          id,
          recipe_id,
          user_id,
          content,
          created_at,
          updated_at
        `)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
        return;
      }

      // Fetch author names for each comment
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', comment.user_id)
              .single();

            return {
              ...comment,
              author_name: profile?.full_name || profile?.username || 'Anonymous Chef'
            };
          } catch (err) {
            console.error('Error fetching author for comment:', comment.id, err);
            return {
              ...comment,
              author_name: 'Anonymous Chef'
            };
          }
        })
      );

      setComments(commentsWithAuthors);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    setShowAddForm(false);
    fetchComments(); // Refresh comments
  };

  const handleCommentUpdated = () => {
    fetchComments(); // Refresh comments
  };

  const handleCommentDeleted = () => {
    fetchComments(); // Refresh comments
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading comments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchComments} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Comments ({comments.length})</CardTitle>
            </div>
            {user?.id && (
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
              >
                {showAddForm ? 'Cancel' : 'Add Comment'}
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Add Comment Form */}
        {showAddForm && user?.id && (
          <CardContent className="pt-0">
            <CommentForm
              recipeId={recipeId}
              onCommentAdded={handleCommentAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        )}
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No comments yet
              </h3>
              <p className="text-gray-500 mb-4">
                Be the first to share your thoughts on this recipe!
              </p>
              {user?.id && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Add First Comment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
