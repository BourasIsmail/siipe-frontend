'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, downloadBlob } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Beneficiaire, SITUATIONS_DIFFICULTE } from '@/lib/models/beneficiaire.model';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';
import type { Province } from '@/lib/models/geo.model';

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f', '#558b2f'];

interface Filters {
  nom: string;
  prenom: string;
  cin: string;
  sexe: string;
  situationDifficulte: string;
  provinceId: number | null;
  etablissementId: number | null;
  dateNaissanceFrom: string;
  dateNaissanceTo: string;
  dateEntreeFrom: string;
  dateEntreeTo: string;
}

function emptyFilters(): Filters {
  return {
    nom: '', prenom: '', cin: '', sexe: '', situationDifficulte: '',
    provinceId: null, etablissementId: null,
    dateNaissanceFrom: '', dateNaissanceTo: '', dateEntreeFrom: '', dateEntreeTo: ''
  };
}

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

  const [filters, setFilters] = useState<Filters>(emptyFilters());
  const [filtered, setFiltered] = useState<Beneficiaire[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [globalQuery, setGlobalQuery] = useState<string | null>(null);

  useEffect(() => {
    api.getProvinces().then(p => setProvinces([...p]));
    api.getEtablissements().then(e => setEtablissements([...e]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchGlobal = useCallback((q: string) => {
    setLoading(true);
    api.searchBeneficiaires({}).then(data => {
      const needle = q.toLowerCase();
      const result = data.filter((b: Beneficiaire) =>
        (b.nom || '').toLowerCase().includes(needle) ||
        (b.prenom || '').toLowerCase().includes(needle) ||
        (b.cin || '').toLowerCase().includes(needle) ||
        ((b as any).numeroDossier || '').toLowerCase().includes(needle)
      );
      setFiltered(result);
      setPageIndex(0);
      setLoading(false);
      setSearched(true);
    }).catch(() => {
      setLoading(false);
      showError(t('BENEFICIAIRE.SEARCH.SEARCH_ERROR'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setGlobalQuery(q);
      searchGlobal(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearGlobalQuery() {
    setGlobalQuery(null);
    resetFilters();
  }

  function search() {
    setLoading(true);
    const params: Record<string, any> = {};
    if (filters.nom) params.nom = filters.nom;
    if (filters.prenom) params.prenom = filters.prenom;
    if (filters.cin) params.cin = filters.cin;
    if (filters.sexe) params.sexe = filters.sexe;
    if (filters.situationDifficulte) params.situationDifficulte = filters.situationDifficulte;
    if (filters.provinceId) params.provinceId = filters.provinceId;
    if (filters.etablissementId) params.etablissementId = filters.etablissementId;
    if (filters.dateNaissanceFrom) params.dateNaissanceFrom = filters.dateNaissanceFrom;
    if (filters.dateNaissanceTo) params.dateNaissanceTo = filters.dateNaissanceTo;
    if (filters.dateEntreeFrom) params.dateEntreeFrom = filters.dateEntreeFrom;
    if (filters.dateEntreeTo) params.dateEntreeTo = filters.dateEntreeTo;

    api.searchBeneficiaires(params).then(data => {
      setFiltered(data);
      setPageIndex(0);
      setLoading(false);
      setSearched(true);
    }).catch(() => {
      setLoading(false);
      showError(t('BENEFICIAIRE.SEARCH.SEARCH_ERROR'));
    });
  }

  function resetFilters() {
    setFilters(emptyFilters());
    setFiltered([]);
    setSearched(false);
  }

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
      setFiltered(f => f.filter(x => x.id !== b.id));
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

      {globalQuery && (
        <div className="global-query-banner">
          <Icon name="search" />
          <span>{t('BENEFICIAIRE.SEARCH.GLOBAL_RESULTS_FOR')} « {globalQuery} »</span>
          <button className="clear-btn" onClick={clearGlobalQuery}>
            <Icon name="close" />
          </button>
        </div>
      )}

      {/* Search filters */}
      <div className="siipe-card mb-2">
        <h3 className="filters-title">{t('BENEFICIAIRE.SEARCH.FILTERS_TITLE')}</h3>
        <div className="filter-grid">
          <div className="field">
            <label>{t('BENEFICIAIRE.NOM')}</label>
            <input type="text" value={filters.nom} onChange={e => setFilters(f => ({ ...f, nom: e.target.value }))} placeholder={t('BENEFICIAIRE.SEARCH.NOM_PLACEHOLDER')} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.PRENOM')}</label>
            <input type="text" value={filters.prenom} onChange={e => setFilters(f => ({ ...f, prenom: e.target.value }))} placeholder={t('BENEFICIAIRE.SEARCH.PRENOM_PLACEHOLDER')} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.CIN')}</label>
            <input type="text" value={filters.cin} onChange={e => setFilters(f => ({ ...f, cin: e.target.value }))} placeholder={t('BENEFICIAIRE.SEARCH.CIN_PLACEHOLDER')} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SEXE')}</label>
            <select value={filters.sexe} onChange={e => setFilters(f => ({ ...f, sexe: e.target.value }))}>
              <option value="">{t('COMMON.ALL')}</option>
              <option value="MASCULIN">{t('BENEFICIAIRE.MASCULIN')}</option>
              <option value="FEMININ">{t('BENEFICIAIRE.FEMININ')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SITUATION')}</label>
            <select value={filters.situationDifficulte} onChange={e => setFilters(f => ({ ...f, situationDifficulte: e.target.value }))}>
              <option value="">{t('BENEFICIAIRE.SEARCH.ALL_FEMININE')}</option>
              {SITUATIONS_DIFFICULTE.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.PROVINCE')}</label>
            <select
              value={filters.provinceId ?? ''}
              onChange={e => setFilters(f => ({ ...f, provinceId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">{t('BENEFICIAIRE.SEARCH.ALL_FEMININE')}</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.ETABLISSEMENT')}</label>
            <select
              value={filters.etablissementId ?? ''}
              onChange={e => setFilters(f => ({ ...f, etablissementId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">{t('COMMON.ALL')}</option>
              {etablissements.map(e => <option key={e.id} value={e.id}>{e.nomFr}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SEARCH.DATE_NAISSANCE_FROM')}</label>
            <input type="date" value={filters.dateNaissanceFrom} onChange={e => setFilters(f => ({ ...f, dateNaissanceFrom: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SEARCH.DATE_NAISSANCE_TO')}</label>
            <input type="date" value={filters.dateNaissanceTo} onChange={e => setFilters(f => ({ ...f, dateNaissanceTo: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SEARCH.DATE_ENTREE_FROM')}</label>
            <input type="date" value={filters.dateEntreeFrom} onChange={e => setFilters(f => ({ ...f, dateEntreeFrom: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('BENEFICIAIRE.SEARCH.DATE_ENTREE_TO')}</label>
            <input type="date" value={filters.dateEntreeTo} onChange={e => setFilters(f => ({ ...f, dateEntreeTo: e.target.value }))} />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-outline" onClick={resetFilters}>
            <Icon name="clear" /> {t('COMMON.RESET')}
          </button>
          <button className="btn btn-primary" onClick={search} disabled={loading}>
            <Icon name="search" /> {t('COMMON.SEARCH')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && searched && (
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
                    <th>{t('BENEFICIAIRE.CIN')}</th>
                    <th>{t('BENEFICIAIRE.SEXE')}</th>
                    <th>{t('BENEFICIAIRE.DATE_NAISSANCE')}</th>
                    <th>{t('BENEFICIAIRE.SITUATION')}</th>
                    <th>{t('BENEFICIAIRE.ETABLISSEMENT')}</th>
                    <th>{t('BENEFICIAIRE.PROVINCE')}</th>
                    <th>{t('BENEFICIAIRE.DATE_ENTREE')}</th>
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
                      <td>{b.cin || '-'}</td>
                      <td>{b.sexe === 'MASCULIN' ? 'M' : b.sexe === 'FEMININ' ? 'F' : '-'}</td>
                      <td>{formatDate(b.dateNaissance)}</td>
                      <td>
                        {b.situationDifficulte ? <span className="badge-situation">{formatEnum(b.situationDifficulte)}</span> : <span>-</span>}
                      </td>
                      <td>{b.etablissementCentreNom || '-'}</td>
                      <td>{b.provinceNom || '-'}</td>
                      <td>{formatDate(b.dateEntree)}</td>
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
                      <td colSpan={9} className="empty-row">{t('BENEFICIAIRE.SEARCH.EMPTY')}</td>
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

      {!loading && !searched && (
        <div className="empty-state-card siipe-card">
          <Icon name="search" />
          <h3>{t('BENEFICIAIRE.SEARCH.EMPTY_STATE_TITLE')}</h3>
          <p>{t('BENEFICIAIRE.SEARCH.EMPTY_STATE_DESC')}</p>
          <button className="btn btn-primary" onClick={search}>
            <Icon name="search" /> {t('BENEFICIAIRE.SEARCH.SHOW_ALL')}
          </button>
        </div>
      )}

      <style jsx>{`
        .global-query-banner {
          display: flex; align-items: center; gap: 10px;
          background: var(--color-primary-surface); color: var(--color-primary-dark);
          border: 1px solid var(--color-primary-light);
          border-radius: var(--radius-md); padding: 10px 14px;
          font-size: 13.5px; margin-bottom: 16px;
        }
        .global-query-banner :global(.material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .global-query-banner .clear-btn {
          margin-inline-start: auto; background: none; border: none; cursor: pointer;
          color: var(--color-primary-dark); display: flex; align-items: center; padding: 4px;
          border-radius: 50%;
        }
        .global-query-banner .clear-btn:hover { background: rgba(0,0,0,0.06); }
        .filters-title { font-size: var(--font-md); font-weight: 700; margin-bottom: 16px; }
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px; margin-bottom: 16px;
        }
        .filter-actions {
          display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;
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
        .empty-state-card { text-align: center; padding: 60px 40px; }
        .empty-state-card :global(.material-icons) { font-size: 64px; width: 64px; height: 64px; color: var(--color-border); display: block; margin: 0 auto 16px; }
        .empty-state-card h3 { color: var(--color-text-secondary); margin-bottom: 8px; }
        .empty-state-card p { color: var(--color-text-tertiary); font-size: 14px; margin-bottom: 24px; }
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
