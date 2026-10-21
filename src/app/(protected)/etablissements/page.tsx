'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, downloadBlob } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';

interface Province {
  id: number;
  nomFr: string;
  nomAr: string;
}

const TYPE_LOCAL_OPTIONS = ['CENTRE_SOCIALE', 'DELEGATION', 'COORDINATION', 'DEPOT', 'AUTRE'];
const MILIEU_OPTIONS = ['URBAIN', 'RURAL'];
const PAGE_SIZES = [10, 25, 50];

export default function EtablissementsListPage() {
  const { hasAnyRole, canDelete } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<EtablissementCentre[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const [filters, setFilters] = useState({
    nom: '',
    provinceId: null as number | null,
    typeLocal: null as string | null,
    milieu: null as string | null
  });

  useEffect(() => {
    api.getEtablissements()
      .then(data => { setAll(data); setLoading(false); })
      .catch(() => setLoading(false));
    api.getProvinces().then(setProvinces).catch(() => {});
  }, []);

  function canEdit() {
    return hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }

  const filtered = useMemo(() => {
    return all.filter(e => {
      const nom = !filters.nom ||
        e.nomFr.toLowerCase().includes(filters.nom.toLowerCase()) ||
        (e.nomAr || '').includes(filters.nom);
      const province = !filters.provinceId || e.provinceId === filters.provinceId;
      const type = !filters.typeLocal || e.typeLocal === filters.typeLocal;
      const milieu = !filters.milieu || e.milieu === filters.milieu;
      return nom && province && type && milieu;
    });
  }, [all, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginated = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePageIndex, pageSize]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, safePageIndex - 2);
    const end = Math.min(totalPages - 1, safePageIndex + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePageIndex, totalPages]);

  function updateFilter<K extends keyof typeof filters>(key: K, value: typeof filters[K]) {
    setFilters(f => ({ ...f, [key]: value }));
    setPageIndex(0);
  }

  function resetFilters() {
    setFilters({ nom: '', provinceId: null, typeLocal: null, milieu: null });
    setPageIndex(0);
  }

  function onPageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  function handleDelete(e: EtablissementCentre) {
    if (!window.confirm(t('ETABLISSEMENT.LIST.CONFIRM_DELETE', { name: e.nomFr }))) return;
    api.deleteEtablissement(e.id)
      .then(() => {
        setAll(prev => prev.filter(x => x.id !== e.id));
        showSuccess(t('ETABLISSEMENT.LIST.DELETED'));
      })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function exportExcel() {
    api.exportExcel('etablissements').then(blob => downloadBlob(blob, 'etablissements.xlsx'));
  }

  function exportPdf() {
    api.exportPdf('etablissements').then(blob => downloadBlob(blob, 'etablissements.pdf'));
  }

  function formatType(type: string | undefined): string {
    return type ? t('ETABLISSEMENT.TYPES.' + type) : '-';
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('ETABLISSEMENT.TITLE')}</h1>
        <div className="flex gap-2">
          <button className="btn btn-excel" onClick={exportExcel}>
            <Icon name="table_view" /> {t('COMMON.EXPORT_EXCEL')}
          </button>
          <button className="btn btn-pdf" onClick={exportPdf}>
            <Icon name="picture_as_pdf" /> {t('COMMON.EXPORT_PDF')}
          </button>
          {canEdit() && (
            <Link href="/etablissements/add" className="btn btn-primary">
              <Icon name="add" /> {t('COMMON.ADD')}
            </Link>
          )}
        </div>
      </div>

      {/* Search filters */}
      <div className="siipe-card mb-2">
        <div className="filter-grid">
          <div className="field">
            <label>{t('ETABLISSEMENT.LIST.NOM')}</label>
            <input
              type="text"
              value={filters.nom}
              onChange={e => updateFilter('nom', e.target.value)}
              placeholder={t('ETABLISSEMENT.LIST.SEARCH_PLACEHOLDER')}
            />
          </div>
          <div className="field">
            <label>{t('ETABLISSEMENT.PROVINCE')}</label>
            <select
              value={filters.provinceId ?? ''}
              onChange={e => updateFilter('provinceId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('ETABLISSEMENT.LIST.ALL_PROVINCES')}</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.nomFr}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('ETABLISSEMENT.TYPE_LOCAL')}</label>
            <select
              value={filters.typeLocal ?? ''}
              onChange={e => updateFilter('typeLocal', e.target.value || null)}
            >
              <option value="">{t('COMMON.ALL')}</option>
              {TYPE_LOCAL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{t('ETABLISSEMENT.TYPES.' + opt)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('ETABLISSEMENT.MILIEU')}</label>
            <select
              value={filters.milieu ?? ''}
              onChange={e => updateFilter('milieu', e.target.value || null)}
            >
              <option value="">{t('COMMON.ALL')}</option>
              {MILIEU_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{t('ETABLISSEMENT.MILIEUX.' + opt)}</option>
              ))}
            </select>
          </div>
          <div className="field reset-field">
            <button className="btn btn-outline" onClick={resetFilters}>
              <Icon name="clear" /> {t('COMMON.RESET')}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <div className="siipe-card">
          <div className="table-meta">
            <span className="text-secondary">{filtered.length} {t('ETABLISSEMENT.LIST.RESULTS')}</span>
            <div className="pagination-controls">
              <select
                className="page-size-select"
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-secondary">{t('ETABLISSEMENT.LIST.PER_PAGE')}</span>
            </div>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('ETABLISSEMENT.LIST.NOM')}</th>
                  <th>{t('ETABLISSEMENT.CODE')}</th>
                  <th>{t('ETABLISSEMENT.PROVINCE')}</th>
                  <th>{t('ETABLISSEMENT.MAP.FILTER_TYPE')}</th>
                  <th>{t('ETABLISSEMENT.MILIEU')}</th>
                  <th>{t('ETABLISSEMENT.CAPACITE')}</th>
                  <th>{t('ETABLISSEMENT.TELEPHONE')}</th>
                  <th>{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(e => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/etablissements/${e.id}`} className="link">{e.nomFr}</Link>
                      <div className="sub-text">{e.nomAr}</div>
                    </td>
                    <td>{e.code || '-'}</td>
                    <td>{e.provinceNom || '-'}</td>
                    <td><span className="chip">{formatType(e.typeLocal)}</span></td>
                    <td>
                      <span
                        className={`status-chip ${e.milieu === 'URBAIN' ? 'active' : ''} ${e.milieu === 'RURAL' ? 'pending' : ''}`}
                      >
                        {e.milieu ? t('ETABLISSEMENT.MILIEUX.' + e.milieu) : '-'}
                      </span>
                    </td>
                    <td>{e.capaciteAccueil ?? '-'}</td>
                    <td>{e.telephone || '-'}</td>
                    <td className="actions">
                      <Link href={`/etablissements/${e.id}`} className="action-btn" title={t('COMMON.VIEW')}>
                        <Icon name="visibility" />
                      </Link>
                      {canEdit() && (
                        <Link href={`/etablissements/${e.id}/edit`} className="action-btn edit" title={t('COMMON.EDIT')}>
                          <Icon name="edit" />
                        </Link>
                      )}
                      {canDelete() && (
                        <button className="action-btn delete" onClick={() => handleDelete(e)}>
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">{t('ETABLISSEMENT.LIST.EMPTY')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>«</button>
              <button className="page-btn" onClick={() => setPageIndex(safePageIndex - 1)} disabled={safePageIndex === 0}>‹</button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === safePageIndex ? 'active' : ''}`}
                  onClick={() => setPageIndex(p)}
                >
                  {p + 1}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPageIndex(safePageIndex + 1)} disabled={safePageIndex >= totalPages - 1}>›</button>
              <button className="page-btn" onClick={() => setPageIndex(totalPages - 1)} disabled={safePageIndex >= totalPages - 1}>»</button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4);
          align-items: end;
        }
        .reset-field { justify-content: flex-end; }

        .table-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .page-size-select {
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-sm);
        }
        /* .link/.action-btn target next/link's <Link> (a custom component) as
           well as native <button>s — styled-jsx only auto-scopes native tags,
           so these must be :global() or the Link instances silently get unstyled. */
        :global(.link) {
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 500;
        }
        :global(.link:hover) { text-decoration: underline; }
        .sub-text { font-size: var(--font-xs); color: var(--color-text-tertiary); direction: rtl; }
        .actions { display: flex; gap: 4px; }
        :global(.action-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          background: transparent;
          color: var(--color-text-secondary);
          text-decoration: none;
        }
        :global(.action-btn:hover) { background: var(--color-surface-2); }
        :global(.action-btn.edit:hover) { color: var(--color-primary); background: var(--color-primary-surface); }
        :global(.action-btn.delete:hover) { color: var(--color-danger); background: var(--color-danger-surface); }
        :global(.action-btn .material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .empty-row { text-align: center; padding: 40px; color: var(--color-text-tertiary); }
        .pagination {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-top: var(--space-4);
        }
        .page-btn {
          padding: 6px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-white);
          cursor: pointer;
          font-size: var(--font-sm);
        }
        .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
}
