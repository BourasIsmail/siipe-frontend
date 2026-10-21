'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/Icon';

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const closeAll = () => { setLangOpen(false); setUserOpen(false); };
    document.addEventListener('click', closeAll);
    return () => document.removeEventListener('click', closeAll);
  }, []);

  const initials = user ? `${user.nom?.charAt(0) || ''}${user.prenom?.charAt(0) || ''}`.toUpperCase() : '';

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/beneficiaires?q=${encodeURIComponent(q)}`);
  }

  function toggleLang(e: React.MouseEvent) {
    e.stopPropagation();
    setLangOpen(o => !o);
    setUserOpen(false);
  }
  function toggleUser(e: React.MouseEvent) {
    e.stopPropagation();
    setUserOpen(o => !o);
    setLangOpen(false);
  }

  return (
    <div className="navbar">
      <button className="icon-btn" onClick={onToggleSidebar}>
        <Icon name="menu" />
      </button>

      <form className="search" onSubmit={onSearch}>
        <Icon name="search" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          name="q"
          placeholder={t('NAV.SEARCH_PLACEHOLDER')}
        />
      </form>

      <span className="spacer" />

      <div className="dropdown">
        <button className="nav-btn" onClick={toggleLang}>
          <Icon name="language" />
          <span>{lang.toUpperCase()}</span>
          <Icon name="arrow_drop_down" />
        </button>
        <div className={`dropdown-menu ${langOpen ? 'show' : ''}`}>
          <button className="dropdown-item" onClick={() => { setLang('fr'); setLangOpen(false); }}>🇫🇷 Français</button>
          <button className="dropdown-item" onClick={() => { setLang('ar'); setLangOpen(false); }}>🇲🇦 العربية</button>
        </div>
      </div>

      <div className="dropdown">
        <button className="nav-btn user-btn" onClick={toggleUser}>
          <span className="avatar">{initials}</span>
          <span className="user-name">{user?.nom} {user?.prenom}</span>
          <Icon name="arrow_drop_down" />
        </button>
        <div className={`dropdown-menu ${userOpen ? 'show' : ''}`}>
          <div className="dropdown-header">
            <span className="avatar avatar-lg">{initials}</span>
            <div>
              <strong>{t('ADMIN.USERS.ROLES.' + (user?.role || ''))}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <hr />
          <button className="dropdown-item" onClick={logout}>
            <Icon name="logout" />
            {t('NAV.LOGOUT')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: linear-gradient(120deg, var(--color-primary-dark), var(--color-primary));
          color: white;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1100;
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 var(--space-5);
          gap: var(--space-2);
          box-shadow: var(--shadow-md);
        }
        .spacer { flex: 1; }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: white; display: flex; align-items: center;
          padding: 8px; border-radius: 50%;
          transition: background 0.15s ease;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.15); }
        @media (min-width: 861px) {
          .icon-btn { display: none; }
        }
        .search {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: var(--radius-pill);
          padding: 7px 14px;
          max-width: 340px;
          width: 100%;
        }
        .search :global(.material-icons) { font-size: 16px; color: rgba(255,255,255,0.75); flex-shrink: 0; }
        .search input {
          border: none; background: none; outline: none; color: white;
          font-size: var(--font-sm); font-family: inherit; width: 100%;
        }
        .search input::placeholder { color: rgba(255,255,255,0.6); }
        @media (max-width: 720px) {
          .search { display: none; }
        }
        .nav-btn {
          background: none; border: none; cursor: pointer;
          color: white; display: flex; align-items: center;
          gap: 6px; padding: 6px 10px 6px 6px; border-radius: var(--radius-xl);
          font-size: var(--font-base); font-family: inherit;
          transition: background 0.15s ease;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.15); }
        .user-btn { padding-inline-start: 4px; }
        .user-name { font-weight: 500; }

        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.22);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
          flex-shrink: 0;
        }
        .avatar-lg { width: 40px; height: 40px; font-size: 15px; background: var(--color-primary-surface); color: var(--color-primary-dark); }

        .dropdown { position: relative; }

        .dropdown-menu {
          display: none;
          position: absolute;
          top: calc(100% + 10px);
          inset-inline-end: 0;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 220px;
          z-index: 9999;
          overflow: hidden;
          flex-direction: column;
        }
        .dropdown-menu.show { display: flex; }

        .dropdown-header {
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .dropdown-header strong { display: block; color: var(--color-text); font-size: var(--font-sm); font-weight: 600; }
        .dropdown-header small { color: var(--color-text-secondary); font-size: var(--font-xs); }

        hr { margin: 0; border: none; border-top: 1px solid var(--color-border); }

        .dropdown-item {
          background: none;
          border: none;
          cursor: pointer;
          padding: 12px 16px;
          text-align: start;
          font-size: var(--font-base);
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          font-family: inherit;
          transition: background 0.15s ease;
        }
        .dropdown-item :global(.material-icons) { font-size: 18px; color: var(--color-text-secondary); }
        .dropdown-item:hover { background: var(--color-primary-surface); }
      `}</style>
    </div>
  );
}
