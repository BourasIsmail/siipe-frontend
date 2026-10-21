'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, downloadBlob } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Beneficiaire, SITUATIONS_DIFFICULTE, SITUATION_COLOR_CLASS } from '@/lib/models/beneficiaire.model';
import type { Province } from '@/lib/models/geo.model';

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f', '#558b2f'];

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function BeneficiairesSearchInner() {
  const { t } = useI18n();
  const { showError, showSuccess } = useToast();
  const { canManageBeneficiaires, canDeleteBeneficiaire } = useAuth();
  const searchParams = useSearchParams();

  const [all, setAll] = useState<Beneficiaire[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<number | ''>('');
  const [situationFilter, setSituationFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    api.getProvinces().then(p => setProvinces([...p])).catch(() => {});
    const q = searchParams.get('q');
    if (q) setQuery(q);
    api.searchBeneficiaires({}).then(data => {
      setAll(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      showError(t('BENEFICIAIRE.SEARCH.SEARCH_ERROR'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(b => {
      if (needle) {
        const hay = `${b.nom} ${b.prenom} ${b.cin || ''} ${(b as any).numeroDossier || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (provinceFilter && b.provinceId !== provinceFilter) return false;
      if (situationFilter && b.situationDifficulte !== situationFilter) return false;
      return true;
    });
  }, [all, query, provinceFilter, situationFilter]);

  useEffect(() => { setPageIndex(0); }, [query, provinceFilter, situationFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, pageIndex - 2);
    const end = Math.min(totalPages - 1, pageIndex + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [pageIndex, totalPages]);

  const paginated = useMemo(() => {
    const start = pageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  function goToPage(index: number) {
    setPageIndex(index);
  }

  function onPageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  async function handleDelete(b: Beneficiaire) {
    if (!window.confirm(t('BENEFICIAIRE.SEARCH.CONFIRM_DELETE', { nom: b.nom, prenom: b.prenom }))) return;
    try {
      await api.deleteBeneficiaire(b.id);
      setAll(a => a.filter(x => x.id !== b.id));
      showSuccess(t('BENEFICIAIRE.SEARCH.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function exportExcel() {
    api.exportExcel('beneficiaires').then(blob => downloadBlob(blob, 'beneficiaires.xlsx'));
  }

  function exportPdf() {
    api.exportPdf('beneficiaires').then(blob => downloadBlob(blob, 'beneficiaires.pdf'));
  }

  function exportFiche(id: number) {
    api.exportBeneficiaireFiche(id).then(blob => downloadBlob(blob, `fiche-beneficiaire-${id}.pdf`));
  }

  function getAvatarColor(b: Beneficiaire): string {
    const index = (b.nom.charCodeAt(0) + b.prenom.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  function formatEnum(val?: string): string {
    if (!val) return '-';
    return t('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + val);
  }

  const canCreate = canManageBeneficiaires();
  const canDelete = canDeleteBeneficiaire();

  return (
    <div>
      <div className="page-header">
        <h1>{t('BENEFICIAIRE.SEARCH.TITLE')}</h1>
        <div className="flex gap-2">
          <button className="btn btn-excel" onClick={exportExcel}>
            <Icon name="table_view" /> {t('COMMON.EXPORT_EXCEL')}
          </button>
          <button className="btn btn-pdf" onClick={exportPdf}>
            <Icon name="picture_as_pdf" /> {t('COMMON.EXPORT_PDF')}
          </button>
          {canCreate && (
            <Link className="btn btn-primary" href="/beneficiaires/add">
              <Icon name="person_add" /> {t('BENEFICIAIRE.SEARCH.INSCRIRE')}
            </Link>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="quick-search">
          <Icon name="search" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('BENEFICIAIRE.SEARCH.CIN_PLACEHOLDER') || 'Nom, CIN, numéro de dossier...'}
          />
        </div>
        <select className="filter-chip" value={provinceFilter} onChange={e => setProvinceFilter(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{t('BENEFICIAIRE.PROVINCE')} : {t('COMMON.ALL')}</option>
          {provinces.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
        </select>
        <select className="filter-chip" value={situationFilter} onChange={e => setSituationFilter(e.target.value)}>
          <option value="">{t('BENEFICIAIRE.SITUATION')} : {t('COMMON.ALL')}</option>
          {SITUATIONS_DIFFICULTE.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <div className="siipe-card">
          <div className="table-meta">
            <span className="text-secondary">{filtered.length} {t('BENEFICIAIRE.SEARCH.RESULTS')}</span>
            <div className="pagination-controls">
              <select className="page-size-select" value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-secondary">{t('BENEFICIAIRE.SEARCH.PER_PAGE')}</span>
            </div>
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.SEARCH.NOM_PRENOM')}</th>
                    <th>{t('BENEFICIAIRE.ETABLISSEMENT')}</th>
                    <th>{t('BENEFICIAIRE.PROVINCE')}</th>
                    <th>{t('BENEFICIAIRE.SITUATION')}</th>
                    <th>{t('COMMON.ACTIONS')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="person-cell">
                          <div className="avatar" style={{ background: getAvatarColor(b) }}>
                            {b.nom.charAt(0)}{b.prenom.charAt(0)}
                          </div>
                          <div>
                            <Link href={`/beneficiaires/${b.id}`} className="link">
                              {b.nom} {b.prenom}
                            </Link>
                            {b.nomAr && <div className="sub-text">{b.nomAr} {b.prenomAr}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{b.etablissementCentreNom || '-'}</td>
                      <td>{b.provinceNom || '-'}</td>
                      <td>
                        {b.situationDifficulte ? (
                          <span className={`badge-situation ${SITUATION_COLOR_CLASS[b.situationDifficulte] || ''}`}>{formatEnum(b.situationDifficulte)}</span>
                        ) : <span>-</span>}
                      </td>
                      <td className="actions">
                        <Link href={`/beneficiaires/${b.id}`} className="action-btn" title={t('BENEFICIAIRE.SEARCH.VIEW_FILE')}>
                          <Icon name="folder_open" />
                        </Link>
                        {canCreate && (
                          <Link href={`/beneficiaires/${b.id}/edit`} className="action-btn edit" title={t('COMMON.EDIT')}>
                            <Icon name="edit" />
                          </Link>
                        )}
                        <button className="action-btn" title={t('BENEFICIAIRE.SEARCH.FICHE_PDF')} onClick={() => exportFiche(b.id)}>
                          <Icon name="print" />
                        </button>
                        {canDelete && (
                          <button className="action-btn delete" title={t('COMMON.DELETE')} onClick={() => handleDelete(b)}>
                            <Icon name="delete" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-row">{t('BENEFICIAIRE.SEARCH.EMPTY')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => goToPage(0)} disabled={pageIndex === 0}>«</button>
              <button className="page-btn" onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0}>‹</button>
              {pageNumbers.map(p => (
                <button key={p} className={`page-btn${p === pageIndex ? ' active' : ''}`} onClick={() => goToPage(p)}>{p + 1}</button>
              ))}
              <button className="page-btn" onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex >= totalPages - 1}>›</button>
              <button className="page-btn" onClick={() => goToPage(totalPages - 1)} disabled={pageIndex >= totalPages - 1}>»</button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .toolbar {
          display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;
        }
        .quick-search {
          flex: 1; max-width: 320px; display: flex; align-items: center; gap: 8px;
          background: var(--color-white); border: 1px solid var(--color-border);
          border-radius: var(--radius-pill); padding: 8px 14px; color: var(--color-text-tertiary);
        }
        .quick-search :global(.material-icons) { font-size: 16px; flex-shrink: 0; }
        .quick-search input {
          border: none; outline: none; background: none; color: var(--color-text);
          font-size: var(--font-sm); width: 100%; font-family: inherit;
        }
        select.filter-chip {
          -webkit-appearance: none; appearance: none;
        }
        .table-meta {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
        }
        .pagination-controls { display: flex; align-items: center; gap: 8px; }
        .page-size-select { padding: 4px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 13px; }
        .table-wrap { overflow-x: auto; }
        .person-cell { display: flex; align-items: center; gap: 10px; }
        .person-cell :global(.avatar) { width: 36px; height: 36px; font-size: 13px; }
        /* .link/.action-btn target next/link's <Link> (a custom component) as
           well as native <button>s — styled-jsx only auto-scopes native tags,
           so these must be :global() or the Link instances silently get unstyled. */
        :global(.link) { color: var(--color-primary); text-decoration: none; font-weight: 500; }
        :global(.link:hover) { text-decoration: underline; }
        .sub-text { font-size: 12px; color: var(--color-text-tertiary); direction: rtl; }
        .actions { display: flex; gap: 4px; }
        :global(.action-btn) {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
          cursor: pointer; background: transparent; color: var(--color-text-secondary); text-decoration: none;
        }
        :global(.action-btn:hover) { background: var(--color-surface-2); }
        :global(.action-btn.edit:hover) { color: var(--color-primary); background: var(--color-primary-surface); }
        :global(.action-btn.delete:hover) { color: var(--color-danger); background: var(--color-danger-surface); }
        :global(.action-btn .material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .empty-row { text-align: center; padding: 40px; color: var(--color-text-tertiary); }
        .pagination { display: flex; justify-content: center; gap: 4px; margin-top: 16px; }
        .page-btn {
          padding: 6px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          background: var(--color-white); cursor: pointer; font-size: 13px;
        }
        .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
}

export default function BeneficiairesPage() {
  return (
    <Suspense fallback={null}>
      <BeneficiairesSearchInner />
    </Suspense>
  );
}
