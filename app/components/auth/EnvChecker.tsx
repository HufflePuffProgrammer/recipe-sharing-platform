"use client";

import { useEffect, useState } from 'react';

export function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<{
    url: boolean;
    key: boolean;
    urlValue?: string;
  }>({ url: false, key: false });

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    setEnvStatus({
      url: !!supabaseUrl,
      key: !!supabaseKey,
      urlValue: supabaseUrl,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        url: !!supabaseUrl,
        key: !!supabaseKey,
        urlValue: supabaseUrl,
      });
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-1">Supabase Config:</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={envStatus.url ? 'text-green-400' : 'text-red-400'}>
            URL: {envStatus.url ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={envStatus.key ? 'text-green-400' : 'text-red-400'}>
            Key: {envStatus.key ? '✅' : '❌'}
          </span>
        </div>
        {!envStatus.url && (
          <div className="text-yellow-400 text-xs mt-1">
            Missing NEXT_PUBLIC_SUPABASE_URL
          </div>
        )}
        {!envStatus.key && (
          <div className="text-yellow-400 text-xs mt-1">
            Missing NEXT_PUBLIC_SUPABASE_ANON_KEY
          </div>
        )}
      </div>
    </div>
  );
}
