'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/Icon';

interface NavItemDef { href: string; icon: string; label: string; exact?: boolean; }

export function Sidebar({ mobileOpen, onMobileOpenChange }: { mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void }) {
  const { user, hasAnyRole, hasRole, isAdmin, canManagePersonnel } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    try { setPinned(localStorage.getItem('siipe_sidebar_pinned') === 'true'); } catch { /* ignore */ }
  }, []);

  function togglePin() {
    setPinned(p => {
      const next = !p;
      try { localStorage.setItem('siipe_sidebar_pinned', String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function onNavigate() {
    if (mobileOpen) onMobileOpenChange(false);
  }

  const canCreateBeneficiaire = hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']);
  const canSeeEntites = hasAnyRole([
    'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE', 'ROLE_CHEF_DIVISION', 'ROLE_COORDINATION'
  ]);
  const canSeePersonnel = canManagePersonnel() || hasRole('ROLE_COORDINATION');

  function isActive(href: string, exact = true) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const mainItems: NavItemDef[] = [
    { href: '/dashboard', icon: 'dashboard', label: t('NAV.DASHBOARD') },
  ];

  const beneficiairesItems: NavItemDef[] = [
    { href: '/beneficiaires', icon: 'search', label: t('MENU.RECHERCHE') },
    ...(canCreateBeneficiaire ? [{ href: '/beneficiaires/add', icon: 'person_add', label: t('MENU.INSCRIPTION'), exact: false }] : []),
  ];

  const entitesItems: NavItemDef[] = [
    { href: '/etablissements', icon: 'business', label: t('MENU.ETABLISSEMENTS') },
    { href: '/partenaires', icon: 'handshake', label: t('MENU.PARTENAIRES') },
    { href: '/subventions', icon: 'payments', label: t('MENU.SUBVENTIONS') },
    { href: '/etablissements/map', icon: 'map', label: t('MENU.CARTOGRAPHIE'), exact: false },
  ];

  const personnelItems: NavItemDef[] = [
    { href: '/personnel', icon: 'people', label: t('MENU.PERSONNEL') },
    { href: '/formations', icon: 'school', label: t('MENU.FORMATION_CONTINUE') },
  ];

  const adminItems: NavItemDef[] = [
    { href: '/admin/users', icon: 'manage_accounts', label: t('MENU.UTILISATEURS') },
    { href: '/programmes', icon: 'category', label: t('MENU.PROGRAMMES') },
  ];

  return (
    <aside className={`rail ${mobileOpen ? 'mobile-open' : ''} ${pinned ? 'pinned' : ''}`}>
      <div className="rail-brand">
        <img className="mark" src="/entraide-logo-mark.png" alt="Entraide Nationale" />
        <span className="word">SIIPE</span>
      </div>
      <nav className="rail-nav">
        <div className="rail-group">
          {mainItems.map(({ href, icon, label, exact }) => (
            <Link key={href} href={href} className={`rail-item ${isActive(href, exact) ? 'active' : ''}`} onClick={onNavigate}>
              <Icon name={icon} />
              <span className="label">{label}</span>
            </Link>
          ))}
        </div>

        <div className="rail-group">
          <div className="rail-group-title">{t('NAV.BENEFICIAIRES')}</div>
          {beneficiairesItems.map(({ href, icon, label, exact }) => (
            <Link key={href} href={href} className={`rail-item ${isActive(href, exact) ? 'active' : ''}`} onClick={onNavigate}>
              <Icon name={icon} />
              <span className="label">{label}</span>
            </Link>
          ))}
        </div>

        {canSeeEntites && (
          <div className="rail-group">
            <div className="rail-group-title">{t('NAV.ETABLISSEMENTS')}</div>
            {entitesItems.map(({ href, icon, label, exact }) => (
              <Link key={href} href={href} className={`rail-item ${isActive(href, exact) ? 'active' : ''}`} onClick={onNavigate}>
                <Icon name={icon} />
                <span className="label">{label}</span>
              </Link>
            ))}
          </div>
        )}

        {canSeePersonnel && (
          <div className="rail-group">
            <div className="rail-group-title">{t('NAV.PERSONNEL')}</div>
            {personnelItems.map(({ href, icon, label, exact }) => (
              <Link key={href} href={href} className={`rail-item ${isActive(href, exact) ? 'active' : ''}`} onClick={onNavigate}>
                <Icon name={icon} />
                <span className="label">{label}</span>
              </Link>
            ))}
          </div>
        )}

        {isAdmin() && (
          <div className="rail-group">
            <div className="rail-group-title">{t('NAV.ADMIN')}</div>
            {adminItems.map(({ href, icon, label, exact }) => (
              <Link key={href} href={href} className={`rail-item ${isActive(href, exact) ? 'active' : ''}`} onClick={onNavigate}>
                <Icon name={icon} />
                <span className="label">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="rail-spacer" />

      {user?.provinceNom && (
        <div className="rail-footer">
          <Icon name="location_on" />
          <span className="label">{user.provinceNom}</span>
        </div>
      )}

      <button className="rail-pin" onClick={togglePin} aria-pressed={pinned}>
        <Icon name={pinned ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'} />
        <span className="label">{t('NAV.PIN')}</span>
      </button>

      <style jsx>{`
        .rail {
          position: fixed;
          top: var(--header-height);
          inset-inline-start: 0;
          width: var(--sidebar-width-collapsed);
          height: calc(100vh - var(--header-height));
          background: var(--color-rail-bg);
          overflow: hidden;
          transition: width 0.18s ease;
          z-index: 950;
          display: flex;
          flex-direction: column;
          padding: var(--space-3) 0;
        }
        .rail:hover, .rail.pinned { width: var(--sidebar-width); }
        .rail:hover { box-shadow: var(--shadow-lg); }

        .rail-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 0 var(--space-3) var(--space-4); width: 100%; white-space: nowrap;
        }
        .rail-brand .mark {
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          background: white; object-fit: contain; padding: 4px; flex-shrink: 0;
        }
        .rail-brand .word {
          font-family: 'Manrope', 'Inter', sans-serif; font-weight: 800; font-size: 14.5px;
          color: white; letter-spacing: 0.2px; opacity: 0; transition: opacity 0.12s ease;
        }
        .rail:hover .rail-brand .word, .rail.pinned .rail-brand .word { opacity: 1; }

        .rail-nav { display: flex; flex-direction: column; padding: 0 var(--space-3); overflow-y: auto; overflow-x: hidden; }
        .rail-group { margin-bottom: var(--space-1); }
        .rail-group-title {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-rail-ink-dim);
          letter-spacing: 0.6px;
          padding: var(--space-3) var(--space-3) var(--space-1);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .rail:hover .rail-group-title, .rail.pinned .rail-group-title { opacity: 1; }
        /* .rail-item is rendered on next/link's <Link>, a custom component —
           styled-jsx's automatic scope-class injection only touches native
           DOM tags, so these rules must be :global() or they silently never match. */
        :global(.rail-item) {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 10px var(--space-3);
          margin: 2px 0;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-rail-ink);
          font-size: var(--font-base);
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease, color 0.15s ease;
        }
        :global(.rail-item .material-icons) {
          font-size: 20px;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }
        :global(.rail-item:hover) { background: rgba(255,255,255,0.08); color: #fff; }
        :global(.rail-item.active) { background: var(--color-primary); color: #fff; font-weight: 600; }

        .label { opacity: 0; transition: opacity 0.12s ease; }
        .rail:hover .label, .rail.pinned .label { opacity: 1; }

        .rail-spacer { flex: 1; }

        .rail-footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: var(--font-xs);
          color: var(--color-rail-ink-dim);
          white-space: nowrap;
          overflow: hidden;
        }
        .rail-footer :global(.material-icons) { font-size: 16px; flex-shrink: 0; }

        .rail-pin {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin: var(--space-1) var(--space-3) 0;
          padding: 10px var(--space-3);
          border-radius: var(--radius-md);
          background: none;
          border: none;
          color: var(--color-rail-ink-dim);
          cursor: pointer;
          font-size: var(--font-sm);
          font-family: inherit;
          white-space: nowrap;
        }
        .rail-pin:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .rail-pin :global(.material-icons) { font-size: 18px; flex-shrink: 0; }

        @media (max-width: 860px) {
          .rail {
            width: var(--sidebar-width);
            inset-inline-start: calc(-1 * var(--sidebar-width));
            transition: inset-inline-start 0.25s ease;
            box-shadow: var(--shadow-lg);
          }
          .rail.mobile-open { inset-inline-start: 0; }
          .label, .rail-group-title { opacity: 1; }
          .rail-pin { display: none; }
        }
      `}</style>
    </aside>
  );
}
