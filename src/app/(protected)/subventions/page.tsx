'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Subvention, Partenaire, EtablissementCentre, Programme } from '@/lib/models/etablissement.model';

const STATUTS = ['EN_COURS', 'TERMINEE', 'SUSPENDUE', 'ANNULEE'];

const STATUT_CLASS: Record<string, string> = {
  EN_COURS: 'badge-green',
  TERMINEE: 'badge-blue',
  SUSPENDUE: 'badge-orange',
  ANNULEE: 'badge-red'
};

const PAGE_SIZE = 10;

interface FormState {
  titre: string;
  montant: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  description: string;
  partenaireId: string;
  etablissementId: string;
  programmeId: string;
}

const EMPTY_FORM: FormState = {
  titre: '', montant: '', statut: 'EN_COURS', dateDebut: '', dateFin: '',
  description: '', partenaireId: '', etablissementId: '', programmeId: ''
};

function formatMontant(n: number | undefined): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export default function SubventionsPage() {
  const { t } = useI18n();
  const { hasAnyRole, canDelete } = useAuth();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<Subvention[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pageIndex, setPageIndex] = useState(0);

  const [filterTitre, setFilterTitre] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPartenaireId, setFilterPartenaireId] = useState('');

  useEffect(() => {
    api.getSubventions().then(d => { setAll(d); setLoading(false); }).catch(() => setLoading(false));
    api.getPartenaires().then(p => setPartenaires(p)).catch(() => {});
    api.getEtablissements().then(e => setEtablissements(e)).catch(() => {});
    api.getProgrammes().then(p => setProgrammes(p)).catch(() => {});
  }, []);

  function canEdit() {
    return hasAnyRole(['ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE', 'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE']);
  }

  const filtered = useMemo(() => {
    return all.filter(s => {
      const titre = !filterTitre || s.titre.toLowerCase().includes(filterTitre.toLowerCase());
      const statut = !filterStatut || s.statut === filterStatut;
      const partenaire = !filterPartenaireId || String(s.partenaireId ?? '') === filterPartenaireId;
      return titre && statut && partenaire;
    });
  }, [all, filterTitre, filterStatut, filterPartenaireId]);

  const totalMontant = useMemo(() => all.reduce((sum, s) => sum + (s.montant || 0), 0), [all]);
  function countByStatut(statut: string) { return all.filter(s => s.statut === statut).length; }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const paginated = filtered.slice(safePageIndex * PAGE_SIZE, safePageIndex * PAGE_SIZE + PAGE_SIZE);
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const s = Math.max(0, safePageIndex - 2);
    const e = Math.min(totalPages - 1, safePageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  }, [safePageIndex, totalPages]);

  function resetFilter() {
    setFilterTitre(''); setFilterStatut(''); setFilterPartenaireId(''); setPageIndex(0);
  }

  function openForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setShowForm(true);
  }

  function openEditForm(s: Subvention) {
    setEditingId(s.id);
    setForm({
      titre: s.titre || '',
      montant: s.montant != null ? String(s.montant) : '',
      statut: s.statut || 'EN_COURS',
      dateDebut: s.dateDebut ? s.dateDebut.slice(0, 10) : '',
      dateFin: s.dateFin ? s.dateFin.slice(0, 10) : '',
      description: s.description || '',
      partenaireId: s.partenaireId != null ? String(s.partenaireId) : '',
      etablissementId: s.etablissementId != null ? String(s.etablissementId) : '',
      programmeId: s.programmeId != null ? String(s.programmeId) : ''
    });
    setTouched({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTouched({});
  }

  const isInvalid = !form.titre.trim() || !form.montant.trim();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ titre: true, montant: true });
    if (isInvalid) return;
    setSaving(true);
    const payload = {
      ...form,
      montant: Number(form.montant),
      partenaireId: form.partenaireId ? Number(form.partenaireId) : undefined,
      etablissementId: form.etablissementId ? Number(form.etablissementId) : undefined,
      programmeId: form.programmeId ? Number(form.programmeId) : undefined
    };
    try {
      const saved = editingId
        ? await api.updateSubvention(editingId, payload)
        : await api.createSubvention(payload);
      setAll(prev => editingId ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setSaving(false);
      closeForm();
      showSuccess(editingId ? t('SUBVENTION.LIST.UPDATED') : t('SUBVENTION.LIST.CREATED'));
    } catch {
      setSaving(false);
      showError(t('COMMON.ERROR'));
    }
  }

  async function handleDelete(s: Subvention) {
    if (!window.confirm(t('SUBVENTION.LIST.CONFIRM_DELETE', { titre: s.titre }))) return;
    try {
      await api.deleteSubvention(s.id);
      setAll(prev => prev.filter(x => x.id !== s.id));
      showSuccess(t('SUBVENTION.LIST.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function getStatutClass(statut: string | undefined): string {
    return statut ? (STATUT_CLASS[statut] || 'badge-gray') : 'badge-gray';
  }

  function formatStatut(statut: string | undefined): string {
    return statut ? t('SUBVENTION.LIST.STATUTS.' + statut) : '-';
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('SUBVENTION.LIST.TITLE')}</h1>
        {canEdit() && (
          <button className="btn btn-primary" onClick={openForm}>
            <Icon name="add" /> {t('COMMON.ADD')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row mb-2">
        <div className="stat-mini">
          <span className="stat-val">{all.length}</span>
          <span className="stat-lbl">{t('SUBVENTION.LIST.STAT_TOTAL')}</span>
        </div>
        <div className="stat-mini green">
          <span className="stat-val">{countByStatut('EN_COURS')}</span>
          <span className="stat-lbl">{t('SUBVENTION.LIST.STATUTS.EN_COURS')}</span>
        </div>
        <div className="stat-mini blue">
          <span className="stat-val num-ltr">{formatMontant(totalMontant)} MAD</span>
          <span className="stat-lbl">{t('SUBVENTION.LIST.STAT_MONTANT_TOTAL')}</span>
        </div>
        <div className="stat-mini orange">
          <span className="stat-val">{countByStatut('TERMINEE')}</span>
          <span className="stat-lbl">{t('SUBVENTION.LIST.STATUTS.TERMINEE')}</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="quick-search">
          <Icon name="search" />
          <input type="text" value={filterTitre} onChange={e => { setFilterTitre(e.target.value); setPageIndex(0); }} placeholder={t('SUBVENTION.LIST.SEARCH_PLACEHOLDER')} />
        </div>
        <select className="filter-chip" value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPageIndex(0); }}>
          <option value="">{t('SUBVENTION.LIST.STATUT')} : {t('COMMON.ALL')}</option>
          {STATUTS.map(s => (<option key={s} value={s}>{t('SUBVENTION.LIST.STATUTS.' + s)}</option>))}
        </select>
        <select className="filter-chip" value={filterPartenaireId} onChange={e => { setFilterPartenaireId(e.target.value); setPageIndex(0); }}>
          <option value="">{t('SUBVENTION.LIST.PARTENAIRE')} : {t('COMMON.ALL')}</option>
          {partenaires.map(p => (<option key={p.id} value={p.id}>{p.nomFr}</option>))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="siipe-card mb-2">
          <h3 className="form-title">{t(editingId ? 'COMMON.EDIT' : 'COMMON.ADD')} {t('SUBVENTION.LIST.FORM_TITLE')}</h3>
          <form onSubmit={onSubmit}>
            <div className="form-row">
              <div className="field">
                <label>{t('SUBVENTION.LIST.TITRE')} *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => updateField('titre', e.target.value)}
                  onBlur={() => setTouched(tt => ({ ...tt, titre: true }))}
                  placeholder={t('SUBVENTION.LIST.TITRE_PLACEHOLDER')}
                />
                {touched.titre && !form.titre.trim() && <span className="err">{t('SUBVENTION.LIST.FIELD_REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.MONTANT_MAD')} *</label>
                <input
                  type="number"
                  value={form.montant}
                  onChange={e => updateField('montant', e.target.value)}
                  onBlur={() => setTouched(tt => ({ ...tt, montant: true }))}
                  placeholder="0"
                />
                {touched.montant && !form.montant.trim() && <span className="err">{t('SUBVENTION.LIST.FIELD_REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.STATUT')}</label>
                <select value={form.statut} onChange={e => updateField('statut', e.target.value)}>
                  <option value="">{t('SUBVENTION.LIST.SELECT_PLACEHOLDER')}</option>
                  {STATUTS.map(s => (
                    <option key={s} value={s}>{t('SUBVENTION.LIST.STATUTS.' + s)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.DATE_DEBUT')}</label>
                <input type="date" value={form.dateDebut} onChange={e => updateField('dateDebut', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.DATE_FIN')}</label>
                <input type="date" value={form.dateFin} onChange={e => updateField('dateFin', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.PARTENAIRE')}</label>
                <select value={form.partenaireId} onChange={e => updateField('partenaireId', e.target.value)}>
                  <option value="">{t('SUBVENTION.LIST.SELECT_PLACEHOLDER')}</option>
                  {partenaires.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.ETABLISSEMENT')}</label>
                <select value={form.etablissementId} onChange={e => updateField('etablissementId', e.target.value)}>
                  <option value="">{t('SUBVENTION.LIST.SELECT_PLACEHOLDER')}</option>
                  {etablissements.map(e => (
                    <option key={e.id} value={e.id}>{e.nomFr}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('SUBVENTION.LIST.PROGRAMME')}</label>
                <select value={form.programmeId} onChange={e => updateField('programmeId', e.target.value)}>
                  <option value="">{t('SUBVENTION.LIST.SELECT_PLACEHOLDER')}</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field mb-2">
              <label>{t('SUBVENTION.LIST.DESCRIPTION')}</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder={t('SUBVENTION.LIST.DESCRIPTION_PLACEHOLDER')}
              />
            </div>
            <div className="form-btns">
              <button type="button" className="btn btn-outline" onClick={closeForm}>{t('COMMON.CANCEL')}</button>
              <button type="submit" className="btn btn-primary" disabled={isInvalid || saving}>
                {saving ? <span className="spinner spinner-sm" /> : t(editingId ? 'COMMON.SAVE' : 'SUBVENTION.LIST.CREATE')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="siipe-card">
          <div className="table-meta">
            <span className="text-secondary">{filtered.length} {t('SUBVENTION.LIST.RESULTS')}</span>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('SUBVENTION.LIST.TITRE')}</th>
                  <th>{t('SUBVENTION.LIST.MONTANT')}</th>
                  <th>{t('SUBVENTION.LIST.STATUT')}</th>
                  <th>{t('SUBVENTION.LIST.PARTENAIRE')}</th>
                  <th>{t('SUBVENTION.LIST.ETABLISSEMENT')}</th>
                  <th>{t('SUBVENTION.LIST.PROGRAMME')}</th>
                  <th>{t('SUBVENTION.LIST.DATE_DEBUT')}</th>
                  <th>{t('SUBVENTION.LIST.DATE_FIN')}</th>
                  <th>{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.titre}</strong></td>
                    <td><strong className="montant num-ltr">{formatMontant(s.montant)} MAD</strong></td>
                    <td>
                      <span className={`badge ${getStatutClass(s.statut)}`}>{formatStatut(s.statut)}</span>
                    </td>
                    <td>{s.partenaireNom || '-'}</td>
                    <td>{s.etablissementNom || '-'}</td>
                    <td>{s.programmeNom || '-'}</td>
                    <td>{formatDate(s.dateDebut)}</td>
                    <td>{formatDate(s.dateFin)}</td>
                    <td className="actions">
                      {canEdit() && (
                        <button className="action-btn edit" title={t('COMMON.EDIT')} onClick={() => openEditForm(s)}>
                          <Icon name="edit" />
                        </button>
                      )}
                      {canDelete() && (
                        <button className="action-btn delete" title={t('COMMON.DELETE')} onClick={() => handleDelete(s)}>
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-row">{t('SUBVENTION.LIST.EMPTY')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>&laquo;</button>
              <button className="page-btn" onClick={() => setPageIndex(safePageIndex - 1)} disabled={safePageIndex === 0}>&lsaquo;</button>
              {pageNumbers.map(n => (
                <button key={n} className={`page-btn ${n === safePageIndex ? 'active' : ''}`} onClick={() => setPageIndex(n)}>{n + 1}</button>
              ))}
              <button className="page-btn" onClick={() => setPageIndex(safePageIndex + 1)} disabled={safePageIndex >= totalPages - 1}>&rsaquo;</button>
              <button className="page-btn" onClick={() => setPageIndex(totalPages - 1)} disabled={safePageIndex >= totalPages - 1}>&raquo;</button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .stats-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
        .stat-mini {
          background: var(--color-white); border-radius: var(--radius-md); padding: 16px 24px;
          box-shadow: var(--shadow-sm); display: flex;
          flex-direction: column; align-items: center; gap: 4px;
          border-inline-start: 4px solid var(--color-border); min-width: 140px;
        }
        .stat-mini.green { border-inline-start-color: var(--color-primary); }
        .stat-mini.blue { border-inline-start-color: var(--color-accent); }
        .stat-mini.orange { border-inline-start-color: var(--color-danger); }
        .stat-val { font-size: 22px; font-weight: 700; color: var(--color-primary); }
        .stat-lbl { font-size: var(--font-xs); color: var(--color-text-tertiary); }
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
        .form-title { font-size: var(--font-md); font-weight: 700; margin-bottom: var(--space-4); }
        .form-btns { display: flex; justify-content: flex-end; gap: var(--space-2); }
        .err { color: var(--color-danger); font-size: var(--font-xs); }
        .table-meta { margin-bottom: var(--space-3); }
        .montant { color: var(--color-primary); }
        .badge { padding: 3px 10px; border-radius: var(--radius-pill); font-size: var(--font-xs); font-weight: 500; }
        .badge-green { background: var(--color-primary-surface); color: var(--color-primary-dark); }
        .badge-blue { background: var(--color-accent-surface); color: var(--color-accent); }
        .badge-orange { background: var(--color-accent-surface); color: var(--color-accent); }
        .badge-red { background: var(--color-danger-surface); color: var(--color-danger); }
        .badge-gray { background: var(--color-surface-2); color: var(--color-text-secondary); }
        .actions { display: flex; gap: 4px; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
          cursor: pointer; background: transparent; color: var(--color-text-secondary);
        }
        .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
        .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
        .empty-row { text-align: center; padding: 40px; color: var(--color-text-tertiary); }
        .pagination { display: flex; justify-content: center; gap: 4px; margin-top: var(--space-4); }
        .page-btn {
          padding: 6px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          background: var(--color-white); cursor: pointer; font-size: var(--font-sm);
        }
        .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
        .spinner-sm {
          width: 16px; height: 16px; border-width: 2px;
          display: inline-block; vertical-align: middle;
        }
      `}</style>
    </div>
  );
}
