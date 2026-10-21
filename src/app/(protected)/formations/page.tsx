'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { FormationContinue, Personnel } from '@/lib/models/personnel.model';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';

const PAGE_SIZE = 9;

interface FormState {
  titre: string;
  organisme: string;
  lieu: string;
  dureeJours: string;
  dateDebut: string;
  dateFin: string;
  description: string;
  etablissementCentreId: string;
  participantIds: number[];
}

const EMPTY_FORM: FormState = {
  titre: '', organisme: '', lieu: '', dureeJours: '', dateDebut: '', dateFin: '',
  description: '', etablissementCentreId: '', participantIds: []
};

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function getFileUrl(path: string): string {
  return `http://localhost:8080/api/files?path=${path}`;
}

export default function FormationsPage() {
  const { t } = useI18n();
  const { canManagePersonnel } = useAuth();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<FormationContinue[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pageIndex, setPageIndex] = useState(0);

  const [filterTitre, setFilterTitre] = useState('');
  const [filterEtabId, setFilterEtabId] = useState('');

  useEffect(() => {
    api.getFormations().then(d => { setAll(d); setLoading(false); }).catch(() => setLoading(false));
    api.getEtablissements().then(e => setEtablissements(e)).catch(() => {});
    api.getPersonnel().then(p => setPersonnel(p)).catch(() => {});
  }, []);

  function canEdit() {
    return canManagePersonnel();
  }

  const filtered = useMemo(() => {
    return all.filter(f => {
      const titre = !filterTitre || f.titre.toLowerCase().includes(filterTitre.toLowerCase());
      const etab = !filterEtabId || String(f.etablissementCentreId ?? '') === filterEtabId;
      return titre && etab;
    });
  }, [all, filterTitre, filterEtabId]);

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
    setFilterTitre(''); setFilterEtabId(''); setPageIndex(0);
  }

  function openForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setShowForm(true);
  }

  function openEditForm(f: FormationContinue) {
    setEditingId(f.id);
    setForm({
      titre: f.titre || '',
      organisme: f.organisme || '',
      lieu: f.lieu || '',
      dureeJours: f.dureeJours != null ? String(f.dureeJours) : '',
      dateDebut: f.dateDebut ? f.dateDebut.slice(0, 10) : '',
      dateFin: f.dateFin ? f.dateFin.slice(0, 10) : '',
      description: f.description || '',
      etablissementCentreId: f.etablissementCentreId != null ? String(f.etablissementCentreId) : '',
      participantIds: f.participants?.map(p => p.id) || []
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

  const isInvalid = !form.titre.trim();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function onParticipantsChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const ids = Array.from(e.target.selectedOptions).map(o => Number(o.value));
    updateField('participantIds', ids);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ titre: true });
    if (isInvalid) return;
    setSaving(true);
    const payload = {
      ...form,
      dureeJours: form.dureeJours ? Number(form.dureeJours) : undefined,
      etablissementCentreId: form.etablissementCentreId ? Number(form.etablissementCentreId) : undefined
    };
    try {
      const saved = editingId
        ? await api.updateFormation(editingId, payload)
        : await api.createFormation(payload);
      setAll(prev => editingId ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setSaving(false);
      closeForm();
      showSuccess(editingId ? t('FORMATION.LIST.UPDATED') : t('FORMATION.LIST.CREATED'));
    } catch {
      setSaving(false);
      showError(t('COMMON.ERROR'));
    }
  }

  async function handleDelete(f: FormationContinue) {
    if (!window.confirm(t('FORMATION.LIST.CONFIRM_DELETE', { titre: f.titre }))) return;
    try {
      await api.deleteFormation(f.id);
      setAll(prev => prev.filter(x => x.id !== f.id));
      showSuccess(t('FORMATION.LIST.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  async function uploadAttestation(e: React.ChangeEvent<HTMLInputElement>, id: number) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const saved = await api.uploadFormationAttestation(id, file);
      setAll(prev => prev.map(x => x.id === saved.id ? saved : x));
      showSuccess(t('FORMATION.LIST.ATTESTATION_UPLOADED'));
    } catch {
      showError(t('FORMATION.LIST.UPLOAD_ERROR'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('FORMATION.LIST.TITLE')}</h1>
        {canEdit() && (
          <button className="btn btn-primary" onClick={openForm}>
            <Icon name="add" /> {t('COMMON.ADD')}
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="quick-search">
          <Icon name="search" />
          <input type="text" value={filterTitre} onChange={e => { setFilterTitre(e.target.value); setPageIndex(0); }} placeholder={t('FORMATION.LIST.SEARCH_PLACEHOLDER')} />
        </div>
        <select className="filter-chip" value={filterEtabId} onChange={e => { setFilterEtabId(e.target.value); setPageIndex(0); }}>
          <option value="">{t('FORMATION.LIST.ETABLISSEMENT')} : {t('COMMON.ALL')}</option>
          {etablissements.map(e => (<option key={e.id} value={e.id}>{e.nomFr}</option>))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="siipe-card mb-2">
          <h3 className="form-title">{t(editingId ? 'FORMATION.LIST.EDIT_FORMATION' : 'FORMATION.LIST.NEW_FORMATION')}</h3>
          <form onSubmit={onSubmit}>
            <div className="form-row">
              <div className="field">
                <label>{t('FORMATION.LIST.TITRE')} *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => updateField('titre', e.target.value)}
                  onBlur={() => setTouched(tt => ({ ...tt, titre: true }))}
                  placeholder={t('FORMATION.LIST.TITRE_PLACEHOLDER')}
                />
                {touched.titre && !form.titre.trim() && <span className="err">{t('FORMATION.LIST.FIELD_REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.ORGANISME')}</label>
                <input
                  type="text"
                  value={form.organisme}
                  onChange={e => updateField('organisme', e.target.value)}
                  placeholder={t('FORMATION.LIST.ORGANISME_PLACEHOLDER')}
                />
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.LIEU')}</label>
                <input
                  type="text"
                  value={form.lieu}
                  onChange={e => updateField('lieu', e.target.value)}
                  placeholder={t('FORMATION.LIST.LIEU_PLACEHOLDER')}
                />
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.DUREE_JOURS')}</label>
                <input type="number" value={form.dureeJours} onChange={e => updateField('dureeJours', e.target.value)} placeholder="0" />
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.DATE_DEBUT')}</label>
                <input type="date" value={form.dateDebut} onChange={e => updateField('dateDebut', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.DATE_FIN')}</label>
                <input type="date" value={form.dateFin} onChange={e => updateField('dateFin', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.ETABLISSEMENT')}</label>
                <select value={form.etablissementCentreId} onChange={e => updateField('etablissementCentreId', e.target.value)}>
                  <option value="">{t('FORMATION.LIST.SELECT_PLACEHOLDER')}</option>
                  {etablissements.map(e => (
                    <option key={e.id} value={e.id}>{e.nomFr}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('FORMATION.LIST.PARTICIPANTS')}</label>
                <select multiple style={{ height: 120 }} value={form.participantIds.map(String)} onChange={onParticipantsChange}>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} {p.prenom} — {p.matricule}</option>
                  ))}
                </select>
                <small className="text-secondary">{t('FORMATION.LIST.MULTISELECT_HINT')}</small>
              </div>
            </div>
            <div className="field mb-2">
              <label>{t('FORMATION.LIST.DESCRIPTION')}</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder={t('FORMATION.LIST.DESCRIPTION_PLACEHOLDER')}
              />
            </div>
            <div className="form-btns">
              <button type="button" className="btn btn-outline" onClick={closeForm}>{t('COMMON.CANCEL')}</button>
              <button type="submit" className="btn btn-primary" disabled={isInvalid || saving}>
                {saving ? <span className="spinner spinner-sm" /> : t(editingId ? 'COMMON.SAVE' : 'FORMATION.LIST.CREATE')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="formations-grid">
          {paginated.map(f => (
            <div className="formation-card siipe-card" key={f.id}>
              <div className="formation-header">
                <div>
                  <h3>{f.titre}</h3>
                  <div className="formation-meta">
                    {f.organisme && <span><Icon name="business" /> {f.organisme}</span>}
                    {f.lieu && <span><Icon name="location_on" /> {f.lieu}</span>}
                    {f.dureeJours ? <span><Icon name="schedule" /> {f.dureeJours} {t('FORMATION.LIST.JOURS')}</span> : null}
                  </div>
                  {(f.dateDebut || f.dateFin) && (
                    <div className="formation-dates">
                      <Icon name="event" />
                      {f.dateDebut ? formatDate(f.dateDebut) : '?'}
                      {f.dateFin && <span> &rarr; {formatDate(f.dateFin)}</span>}
                    </div>
                  )}
                  {f.etablissementCentreNom && (
                    <div className="text-secondary etab-line">
                      <Icon name="business" className="etab-icon" />
                      {f.etablissementCentreNom}
                    </div>
                  )}
                </div>
                {canEdit() && (
                  <div className="formation-actions">
                    <button className="action-btn edit" title={t('COMMON.EDIT')} onClick={() => openEditForm(f)}>
                      <Icon name="edit" />
                    </button>
                    <button className="action-btn delete" title={t('COMMON.DELETE')} onClick={() => handleDelete(f)}>
                      <Icon name="delete" />
                    </button>
                  </div>
                )}
              </div>

              {f.description && <div className="description-text">{f.description}</div>}

              {f.participants && f.participants.length > 0 && (
                <div className="participants-section">
                  <div className="participants-label">
                    <Icon name="group" /> {f.participants.length} {t('FORMATION.LIST.PARTICIPANTS_COUNT')}
                  </div>
                  <div className="participants-chips">
                    {f.participants.map(p => (
                      <span className="chip" key={p.id}>{p.nom} {p.prenom}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="attestation-section">
                {f.attestationUrl && (
                  <a href={getFileUrl(f.attestationUrl)} target="_blank" rel="noopener noreferrer" className="doc-link">
                    <Icon name="description" /> {t('FORMATION.LIST.VIEW_ATTESTATION')}
                  </a>
                )}
                {canEdit() && (
                  <label className="upload-btn">
                    <Icon name="upload" />
                    {t(f.attestationUrl ? 'FORMATION.LIST.CHANGE_ATTESTATION' : 'FORMATION.LIST.ADD_ATTESTATION')}
                    <input type="file" hidden onChange={e => uploadAttestation(e, f.id)} />
                  </label>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state">
              <Icon name="school" />
              <p>{t('FORMATION.LIST.EMPTY')}</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
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
        .form-title { font-size: var(--font-md); font-weight: 700; margin-bottom: var(--space-4); }
        .form-btns { display: flex; justify-content: flex-end; gap: var(--space-2); }
        .err { color: var(--color-danger); font-size: var(--font-xs); }
        .formations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-4); }
        .formation-card { border-top: 3px solid var(--color-primary); margin-bottom: 0; }
        .formation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .formation-header h3 { font-size: var(--font-md); color: var(--color-primary); margin-bottom: 6px; }
        .formation-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: var(--font-sm); color: var(--color-text-secondary); margin-bottom: 4px; }
        .formation-meta span { display: flex; align-items: center; gap: 4px; }
        .formation-meta :global(.material-icons) { font-size: 14px; }
        .formation-dates { display: flex; align-items: center; gap: 6px; font-size: var(--font-sm); color: var(--color-text-secondary); }
        .formation-dates :global(.material-icons) { font-size: 14px; color: var(--color-primary); }
        .etab-line { font-size: 13px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .etab-line :global(.etab-icon) { font-size: 14px; }
        .formation-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
          cursor: pointer; background: transparent; color: var(--color-text-secondary);
        }
        .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
        .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
        .description-text { font-size: var(--font-sm); color: var(--color-text-secondary); margin-bottom: 12px; padding: 8px; background: var(--color-surface-2); border-radius: var(--radius-sm); }
        .participants-section { margin-top: 12px; }
        .participants-label { display: flex; align-items: center; gap: 6px; font-size: var(--font-sm); color: var(--color-text-secondary); font-weight: 500; margin-bottom: 8px; }
        .participants-label :global(.material-icons) { font-size: 16px; color: var(--color-primary); }
        .participants-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .attestation-section { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); }
        .doc-link { display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-size: var(--font-sm); text-decoration: none; }
        .doc-link :global(.material-icons) { font-size: 16px; }
        .doc-link:hover { text-decoration: underline; }
        .upload-btn {
          display: flex; align-items: center; gap: 6px; cursor: pointer;
          color: var(--color-text-secondary); font-size: var(--font-sm); padding: 5px 10px;
          border: 1px dashed var(--color-border); border-radius: var(--radius-sm);
        }
        .upload-btn :global(.material-icons) { font-size: 16px; }
        .upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .empty-state {
          text-align: center; padding: 60px; color: var(--color-text-tertiary); background: var(--color-white);
          border-radius: var(--radius-lg); grid-column: 1 / -1;
        }
        .empty-state :global(.material-icons) { font-size: 56px; display: block; margin: 0 auto 12px; }
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
