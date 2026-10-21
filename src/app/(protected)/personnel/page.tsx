'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, downloadBlob } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Personnel } from '@/lib/models/personnel.model';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f', '#558b2f', '#4527a0'];

const LIST_GRADES = [
  'ADMINISTRATEUR_1ER_GRADE', 'ADMINISTRATEUR_2EME_GRADE', 'ADMINISTRATEUR_3EME_GRADE',
  'REDACTEUR_1ER_GRADE', 'REDACTEUR_2EME_GRADE', 'REDACTEUR_3EME_GRADE',
  'TECHNICIEN_PREMIER_GRADE', 'TECHNICIEN_DEUXIEME_GRADE', 'TECHNICIEN_TROISIEME_GRADE',
  'ADJOINT_ADMINISTRATIF_1ER_GRADE', 'ADJOINT_TECHNIQUE_1ER_GRADE', 'AGENTS_A_CONTRAT'
];

const LIST_FONCTIONS = [
  'DIRECTEUR', 'DIRECTEUR_DU_CENTRE', 'DIRECTEUR_PROVINCIAL', 'DIRECTEUR_REGIONAL',
  'CHEF_DE_SERVICE', 'CHEF_DE_DIVISION', 'SOUS_DIRECTEUR', 'ASSISTANT_SOCIAL',
  'MEDECIN', 'INFIRMIER', 'PSYCHOLOGUE', 'EDUCATEUR', 'FORMATEUR'
];

function formatDate(date?: string): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export default function PersonnelListPage() {
  const { isAdmin, canEditPersonnel } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<Personnel[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const [filters, setFilters] = useState({
    nom: '',
    matricule: '',
    etablissementId: null as number | null,
    grade: '',
    fonction: ''
  });

  useEffect(() => {
    api.getPersonnel()
      .then(data => { setAll(data); setLoading(false); })
      .catch(() => setLoading(false));
    api.getEtablissements()
      .then(e => setEtablissements(e))
      .catch(() => {});
  }, []);

  function formatEnum(val: string | undefined, group: string): string {
    if (!val) return '-';
    const key = `PERSONNEL.LIST.${group}.${val}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return humanize(val);
  }

  function getAvatarColor(p: Personnel): string {
    const index = (p.nom.charCodeAt(0) + p.prenom.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  const filtered = useMemo(() => {
    return all.filter(p => {
      const nom = !filters.nom ||
        `${p.nom} ${p.prenom}`.toLowerCase().includes(filters.nom.toLowerCase());
      const matricule = !filters.matricule ||
        p.matricule.toLowerCase().includes(filters.matricule.toLowerCase());
      const etab = !filters.etablissementId ||
        p.etablissementCentreId === filters.etablissementId;
      const grade = !filters.grade || p.grade === filters.grade;
      const fonction = !filters.fonction || p.fonction === filters.fonction;
      return nom && matricule && etab && grade && fonction;
    });
  }, [all, filters]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = useMemo(() => {
    const start = pageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, pageIndex - 2);
    const end = Math.min(totalPages - 1, pageIndex + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, pageIndex]);

  function updateFilter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPageIndex(0);
  }

  function resetFilters() {
    setFilters({ nom: '', matricule: '', etablissementId: null, grade: '', fonction: '' });
    setPageIndex(0);
  }

  function goToPage(index: number) {
    setPageIndex(index);
  }

  function onPageSizeChange(value: number) {
    setPageSize(value);
    setPageIndex(0);
  }

  async function handleDelete(p: Personnel) {
    if (!confirm(t('PERSONNEL.LIST.CONFIRM_DELETE', { name: `${p.nom} ${p.prenom}` }))) return;
    try {
      await api.deletePersonnel(p.id);
      setAll(prev => prev.filter(x => x.id !== p.id));
      showSuccess(t('PERSONNEL.LIST.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function exportExcel() {
    api.exportExcel('personnel').then(blob => downloadBlob(blob, 'personnel.xlsx'));
  }

  function exportPdf() {
    api.exportPdf('personnel').then(blob => downloadBlob(blob, 'personnel.pdf'));
  }

  return (
    <div className="personnel-list">
      <div className="page-header">
        <h1>{t('PERSONNEL.LIST.TITLE')}</h1>
        <div className="flex gap-2">
          <button className="btn btn-excel" onClick={exportExcel}>
            <Icon name="table_view" /> {t('COMMON.EXPORT_EXCEL')}
          </button>
          <button className="btn btn-pdf" onClick={exportPdf}>
            <Icon name="picture_as_pdf" /> {t('COMMON.EXPORT_PDF')}
          </button>
          {canEditPersonnel() && (
            <Link className="btn btn-primary" href="/personnel/add">
              <Icon name="person_add" /> {t('COMMON.ADD')}
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="siipe-card mb-2">
        <div className="filter-grid">
          <div className="field">
            <label>{t('PERSONNEL.LIST.NOM_PRENOM')}</label>
            <input
              type="text"
              value={filters.nom}
              onChange={e => updateFilter('nom', e.target.value)}
              placeholder={t('PERSONNEL.LIST.SEARCH_PLACEHOLDER')}
            />
          </div>
          <div className="field">
            <label>{t('PERSONNEL.MATRICULE')}</label>
            <input
              type="text"
              value={filters.matricule}
              onChange={e => updateFilter('matricule', e.target.value)}
              placeholder={t('PERSONNEL.LIST.MATRICULE_PLACEHOLDER')}
            />
          </div>
          <div className="field">
            <label>{t('PERSONNEL.ETABLISSEMENT')}</label>
            <select
              value={filters.etablissementId ?? ''}
              onChange={e => updateFilter('etablissementId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('COMMON.ALL')}</option>
              {etablissements.map(e => (
                <option key={e.id} value={e.id}>{e.nomFr}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('PERSONNEL.GRADE')}</label>
            <select value={filters.grade} onChange={e => updateFilter('grade', e.target.value)}>
              <option value="">{t('COMMON.ALL')}</option>
              {LIST_GRADES.map(g => (
                <option key={g} value={g}>{t(`PERSONNEL.LIST.GRADES.${g}`)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('PERSONNEL.FONCTION')}</label>
            <select value={filters.fonction} onChange={e => updateFilter('fonction', e.target.value)}>
              <option value="">{t('COMMON.ALL')}</option>
              {LIST_FONCTIONS.map(f => (
                <option key={f} value={f}>{t(`PERSONNEL.LIST.FONCTIONS.${f}`)}</option>
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
            <span className="text-secondary">{filtered.length} {t('PERSONNEL.LIST.AGENTS_COUNT')}</span>
            <div className="pagination-controls">
              <select
                className="page-size-select"
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-secondary">{t('PERSONNEL.LIST.PER_PAGE')}</span>
            </div>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('PERSONNEL.LIST.NOM_PRENOM')}</th>
                  <th>{t('PERSONNEL.MATRICULE')}</th>
                  <th>{t('PERSONNEL.LIST.SEXE')}</th>
                  <th>{t('PERSONNEL.GRADE')}</th>
                  <th>{t('PERSONNEL.FONCTION')}</th>
                  <th>{t('PERSONNEL.ETABLISSEMENT')}</th>
                  <th>{t('PERSONNEL.DATE_RECRUTEMENT')}</th>
                  <th>{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar" style={{ background: getAvatarColor(p) }}>
                          {p.nom.charAt(0)}{p.prenom.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/personnel/${p.id}`} className="link">{p.nom} {p.prenom}</Link>
                          <div className="sub-text">{p.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip badge-gray">{p.matricule}</span></td>
                    <td>{p.sexe === 'MASCULIN' ? 'M' : p.sexe === 'FEMININ' ? 'F' : '-'}</td>
                    <td>{formatEnum(p.grade, 'GRADES')}</td>
                    <td>{formatEnum(p.fonction, 'FONCTIONS')}</td>
                    <td>{p.etablissementCentreNom || '-'}</td>
                    <td>{formatDate(p.dateRecrutement)}</td>
                    <td className="actions">
                      <Link href={`/personnel/${p.id}`} className="action-btn" title={t('COMMON.VIEW')}>
                        <Icon name="visibility" />
                      </Link>
                      <Link href={`/personnel/${p.id}/evaluation`} className="action-btn eval" title={t('PERSONNEL.LIST.EVALUATION_TOOLTIP')}>
                        <Icon name="assignment" />
                      </Link>
                      {canEditPersonnel() && (
                        <Link href={`/personnel/${p.id}/edit`} className="action-btn edit" title={t('COMMON.EDIT')}>
                          <Icon name="edit" />
                        </Link>
                      )}
                      {isAdmin() && (
                        <button className="action-btn delete" onClick={() => handleDelete(p)} title={t('COMMON.DELETE')}>
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">{t('PERSONNEL.LIST.EMPTY')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => goToPage(0)} disabled={pageIndex === 0}>«</button>
              <button className="page-btn" onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0}>‹</button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  className={`page-btn${p === pageIndex ? ' active' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p + 1}
                </button>
              ))}
              <button className="page-btn" onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex >= totalPages - 1}>›</button>
              <button className="page-btn" onClick={() => goToPage(totalPages - 1)} disabled={pageIndex >= totalPages - 1}>»</button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          align-items: end;
        }
        .reset-field { justify-content: flex-end; padding-top: 20px; }
        .table-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .pagination-controls { display: flex; align-items: center; gap: 8px; }
        .page-size-select {
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-sm);
          font-family: inherit;
          background: var(--color-white);
          color: var(--color-text);
        }
        .person-cell { display: flex; align-items: center; gap: 10px; }
        /* .link/.action-btn target next/link's <Link> (a custom component) as
           well as native <button>s — styled-jsx only auto-scopes native tags,
           so these must be :global() or the Link instances silently get unstyled. */
        :global(.link) { color: var(--color-primary); text-decoration: none; font-weight: 500; }
        :global(.link:hover) { text-decoration: underline; }
        .sub-text { font-size: 12px; color: var(--color-text-tertiary); }
        .badge-gray { background: var(--color-surface-2); color: var(--color-text-secondary); }
        .actions { display: flex; gap: 4px; }
        :global(.action-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          background: transparent;
          color: var(--color-text-secondary);
          text-decoration: none;
        }
        :global(.action-btn:hover) { background: var(--color-surface-2); }
        :global(.action-btn.eval:hover) { color: var(--color-accent); background: var(--color-accent-surface); }
        :global(.action-btn.edit:hover) { color: var(--color-primary); background: var(--color-primary-surface); }
        :global(.action-btn.delete:hover) { color: var(--color-danger); background: var(--color-danger-surface); }
        :global(.action-btn .material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .empty-row { text-align: center; padding: 40px; color: var(--color-text-tertiary); }
        .pagination { display: flex; justify-content: center; gap: 4px; margin-top: 16px; }
        .page-btn {
          padding: 6px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-white);
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          color: var(--color-text);
        }
        .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
}
