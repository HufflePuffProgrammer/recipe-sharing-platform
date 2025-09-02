"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from './supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null);

  // Initialize Supabase client in useEffect to avoid conditional hook calls
  useEffect(() => {
    try {
      const client = createClient();
      setSupabaseClient(client);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabaseClient) return;
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        // Only log meaningful auth events, not initial session check
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state changed:', event, session?.user?.email);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  const signUp = async (email: string, password: string) => {
    if (!supabaseClient) {
      return { error: 'Authentication not available' };
    }

    try {
      console.log('Attempting to sign up with:', { email, passwordLength: password.length });

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);

        // Handle specific database errors
        if (error.message.includes('Database error saving new user')) {
          return {
            error: 'Database setup required. Please ensure your Supabase project has the auth schema properly configured and RLS policies are set up correctly.'
          };
        }

        if (error.message.includes('User already registered')) {
          return {
            error: 'An account with this email already exists. Try signing in instead.'
          };
        }

        if (error.message.includes('Invalid email')) {
          return {
            error: 'Please enter a valid email address.'
          };
        }

        if (error.message.includes('Password should be at least')) {
          return {
            error: 'Password must be at least 6 characters long.'
          };
        }

        return { error: error.message };
      }

      if (data.user && !data.session) {
        return { error: 'Account created! Please check your email to confirm your account before signing in.' };
      }

      return {};
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return {
        error: 'Unable to connect to authentication service. Please check your internet connection and try again.'
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabaseClient) {
      return { error: 'Authentication not available' };
    }

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (!supabaseClient) {
      return;
    }

    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabaseClient) {
      return { error: 'Authentication not available' };
    }

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
