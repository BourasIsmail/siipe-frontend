'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/auth/login');
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className="app-layout">
      <Navbar onToggleSidebar={() => setMobileOpen(o => !o)} />
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
      <main className="app-content">{children}</main>

      <style jsx>{`
        .app-layout {
          min-height: 100vh;
          background: var(--color-bg);
        }
        .app-content {
          padding: 24px;
          padding-top: calc(var(--header-height) + 24px);
          margin-inline-start: var(--sidebar-width-collapsed);
          min-height: 100vh;
        }
        .scrim {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(10, 16, 12, 0.45);
          z-index: 940;
        }
        @media (max-width: 860px) {
          .app-content { margin-inline-start: 0; }
          .scrim { display: block; }
        }
      `}</style>
    </div>
  );
}
