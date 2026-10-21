'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/auth/login');
  }, [loading, isAuthenticated, router]);

  return null;
}
