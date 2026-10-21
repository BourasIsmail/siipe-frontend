'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/Icon';

const CRUMB_ROUTES: { prefix: string; labelKey: string }[] = [
  { prefix: '/dashboard', labelKey: 'NAV.DASHBOARD' },
  { prefix: '/etablissements/map', labelKey: 'MENU.CARTOGRAPHIE' },
  { prefix: '/etablissements', labelKey: 'MENU.ETABLISSEMENTS' },
  { prefix: '/beneficiaires', labelKey: 'MENU.RECHERCHE' },
  { prefix: '/partenaires', labelKey: 'MENU.PARTENAIRES' },
  { prefix: '/subventions', labelKey: 'MENU.SUBVENTIONS' },
  { prefix: '/personnel', labelKey: 'MENU.PERSONNEL' },
  { prefix: '/formations', labelKey: 'MENU.FORMATION_CONTINUE' },
  { prefix: '/admin/users', labelKey: 'MENU.UTILISATEURS' },
  { prefix: '/programmes', labelKey: 'MENU.PROGRAMMES' },
];

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const closeAll = () => setUserOpen(false);
    document.addEventListener('click', closeAll);
    return () => document.removeEventListener('click', closeAll);
  }, []);

  const initials = user ? `${user.nom?.charAt(0) || ''}${user.prenom?.charAt(0) || ''}`.toUpperCase() : '';
  const crumbKey = CRUMB_ROUTES.find(r => pathname.startsWith(r.prefix))?.labelKey;

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/beneficiaires?q=${encodeURIComponent(q)}`);
  }

  function toggleUser(e: React.MouseEvent) {
    e.stopPropagation();
    setUserOpen(o => !o);
  }

  return (
    <div className="navbar">
      <button className="icon-btn" onClick={onToggleSidebar}>
        <Icon name="menu" />
      </button>

      <div className="crumb">
        <span>{t('APP_TITLE').split(' ')[0] || 'SIIPE'}</span>
        {crumbKey && <><span>/</span><strong>{t(crumbKey)}</strong></>}
      </div>

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

      <div className="lang-switch">
        <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
        <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>ع</button>
      </div>

      <div className="dropdown">
        <button className="avatar-btn" onClick={toggleUser}>
          <span className="avatar">{initials}</span>
        </button>
        <div className={`dropdown-menu ${userOpen ? 'show' : ''}`}>
          <div className="dropdown-header">
            <span className="avatar avatar-lg">{initials}</span>
            <div>
              <strong>{user?.nom} {user?.prenom}</strong>
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
          background: var(--color-white);
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border);
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1100;
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 var(--space-5);
          gap: var(--space-4);
        }
        .spacer { flex: 1; }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--color-text); display: flex; align-items: center;
          padding: 8px; border-radius: 50%;
          transition: background 0.15s ease;
        }
        .icon-btn:hover { background: var(--color-surface-2); }
        @media (min-width: 861px) {
          .icon-btn { display: none; }
        }
        .crumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; color: var(--color-text-tertiary); white-space: nowrap;
        }
        .crumb strong { color: var(--color-text); font-weight: 600; }
        @media (max-width: 720px) {
          .crumb { display: none; }
        }
        .search {
          display: flex; align-items: center; gap: 8px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-pill);
          padding: 7px 14px;
          max-width: 340px;
          width: 100%;
        }
        .search :global(.material-icons) { font-size: 16px; color: var(--color-text-tertiary); flex-shrink: 0; }
        .search input {
          border: none; background: none; outline: none; color: var(--color-text);
          font-size: var(--font-sm); font-family: inherit; width: 100%;
        }
        .search input::placeholder { color: var(--color-text-tertiary); }
        @media (max-width: 720px) {
          .search { display: none; }
        }
        .lang-switch {
          display: flex; background: var(--color-surface-2); border: 1px solid var(--color-border);
          border-radius: var(--radius-pill); padding: 3px; gap: 2px; flex-shrink: 0;
        }
        .lang-switch button {
          border: none; background: none; padding: 5px 11px; border-radius: var(--radius-pill);
          font-size: 12px; font-weight: 600; color: var(--color-text-tertiary); cursor: pointer;
          font-family: inherit;
        }
        .lang-switch button.active { background: var(--color-primary); color: white; }

        .avatar-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          display: flex; align-items: center; border-radius: 50%;
        }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--color-primary-surface);
          color: var(--color-primary-dark);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
          flex-shrink: 0;
        }
        .avatar-lg { width: 40px; height: 40px; font-size: 15px; }

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
