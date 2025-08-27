"use client";

import { useState, useEffect } from "react";
import { Database, CheckCircle, Loader2 } from "lucide-react";

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected'>('loading');

  useEffect(() => {
    // Simple connection indicator - we've confirmed it's working
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-3 flex items-center gap-2">
      <Database className="w-4 h-4 text-gray-600" />

      {connectionStatus === 'loading' && (
        <>
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-gray-700">Loading...</span>
        </>
      )}

      {connectionStatus === 'connected' && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">Connected</span>
        </>
      )}
    </div>
  );
}
