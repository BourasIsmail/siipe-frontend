'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Partenaire } from '@/lib/models/etablissement.model';
import type { Province } from '@/lib/models/geo.model';

const PARTENAIRE_TYPES = ['ONG', 'ASSOCIATION', 'INSTITUTION_PUBLIQUE', 'ENTREPRISE_PRIVEE', 'ORGANISME_INTERNATIONAL', 'AUTRE'];

const PAGE_SIZE = 10;

interface FormState {
  nomFr: string;
  nomAr: string;
  type: string;
  responsable: string;
  telephone: string;
  email: string;
  adresse: string;
  description: string;
  provinceId: string;
}

const EMPTY_FORM: FormState = {
  nomFr: '', nomAr: '', type: '', responsable: '', telephone: '',
  email: '', adresse: '', description: '', provinceId: ''
};

export default function PartenairesPage() {
  const { t } = useI18n();
  const { hasAnyRole, canDelete } = useAuth();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<Partenaire[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pageIndex, setPageIndex] = useState(0);

  const [filterNom, setFilterNom] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProvinceId, setFilterProvinceId] = useState<string>('');

  useEffect(() => {
    api.getPartenaires().then(d => { setAll(d); setLoading(false); }).catch(() => setLoading(false));
    api.getProvinces().then(p => setProvinces(p)).catch(() => {});
  }, []);

  function canEdit() {
    return hasAnyRole(['ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE', 'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE']);
  }

  const filtered = useMemo(() => {
    return all.filter(p => {
      const nom = !filterNom || p.nomFr.toLowerCase().includes(filterNom.toLowerCase());
      const type = !filterType || p.type === filterType;
      const province = !filterProvinceId || String(p.provinceId ?? '') === filterProvinceId;
      return nom && type && province;
    });
  }, [all, filterNom, filterType, filterProvinceId]);

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
    setFilterNom(''); setFilterType(''); setFilterProvinceId(''); setPageIndex(0);
  }

  function openForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setShowForm(true);
  }

  function openEditForm(p: Partenaire) {
    setEditingId(p.id);
    setForm({
      nomFr: p.nomFr || '',
      nomAr: p.nomAr || '',
      type: p.type || '',
      responsable: p.responsable || '',
      telephone: p.telephone || '',
      email: p.email || '',
      adresse: p.adresse || '',
      description: p.description || '',
      provinceId: p.provinceId != null ? String(p.provinceId) : ''
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

  const isInvalid = !form.nomFr.trim() || !form.nomAr.trim();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nomFr: true, nomAr: true });
    if (isInvalid) return;
    setSaving(true);
    const payload = {
      ...form,
      provinceId: form.provinceId ? Number(form.provinceId) : undefined
    };
    try {
      const saved = editingId
        ? await api.updatePartenaire(editingId, payload)
        : await api.createPartenaire(payload);
      setAll(prev => editingId ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setSaving(false);
      closeForm();
      showSuccess(editingId ? t('PARTENAIRE.LIST.UPDATED') : t('PARTENAIRE.LIST.CREATED'));
    } catch {
      setSaving(false);
      showError(t('COMMON.ERROR'));
    }
  }

  async function handleDelete(p: Partenaire) {
    if (!window.confirm(t('PARTENAIRE.LIST.CONFIRM_DELETE', { name: p.nomFr }))) return;
    try {
      await api.deletePartenaire(p.id);
      setAll(prev => prev.filter(x => x.id !== p.id));
      showSuccess(t('PARTENAIRE.LIST.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function formatType(type: string | undefined): string {
    return type ? t('PARTENAIRE.LIST.TYPES.' + type) : '-';
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('PARTENAIRE.LIST.TITLE')}</h1>
        {canEdit() && (
          <button className="btn btn-primary" onClick={openForm}>
            <Icon name="add" /> {t('COMMON.ADD')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="siipe-card mb-2">
        <div className="filter-grid">
          <div className="field">
            <label>{t('PARTENAIRE.LIST.NOM')}</label>
            <input
              type="text"
              value={filterNom}
              onChange={e => { setFilterNom(e.target.value); setPageIndex(0); }}
              placeholder={t('PARTENAIRE.LIST.SEARCH_PLACEHOLDER')}
            />
          </div>
          <div className="field">
            <label>{t('PARTENAIRE.LIST.TYPE')}</label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPageIndex(0); }}>
              <option value="">{t('COMMON.ALL')}</option>
              {PARTENAIRE_TYPES.map(type => (
                <option key={type} value={type}>{t('PARTENAIRE.LIST.TYPES.' + type)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('PARTENAIRE.LIST.PROVINCE')}</label>
            <select value={filterProvinceId} onChange={e => { setFilterProvinceId(e.target.value); setPageIndex(0); }}>
              <option value="">{t('PARTENAIRE.LIST.ALL_PROVINCES')}</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.nomFr}</option>
              ))}
            </select>
          </div>
          <div className="field filter-reset">
            <button className="btn btn-outline" onClick={resetFilter}>
              <Icon name="clear" /> {t('COMMON.RESET')}
            </button>
          </div>
        </div>
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
          <h3 className="form-title">{t(editingId ? 'PARTENAIRE.LIST.FORM_TITLE_EDIT' : 'PARTENAIRE.LIST.FORM_TITLE_ADD')}</h3>
          <form onSubmit={onSubmit}>
            <div className="form-row">
              <div className="field">
                <label>{t('PARTENAIRE.LIST.NOM_FR_LABEL')}</label>
                <input
                  type="text"
                  value={form.nomFr}
                  onChange={e => updateField('nomFr', e.target.value)}
                  onBlur={() => setTouched(tt => ({ ...tt, nomFr: true }))}
                  placeholder={t('PARTENAIRE.LIST.NOM_PLACEHOLDER')}
                />
                {touched.nomFr && !form.nomFr.trim() && <span className="err">{t('PARTENAIRE.LIST.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.NOM_AR_LABEL')}</label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.nomAr}
                  onChange={e => updateField('nomAr', e.target.value)}
                  onBlur={() => setTouched(tt => ({ ...tt, nomAr: true }))}
                  placeholder="الاسم"
                />
                {touched.nomAr && !form.nomAr.trim() && <span className="err">{t('PARTENAIRE.LIST.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.TYPE')}</label>
                <select value={form.type} onChange={e => updateField('type', e.target.value)}>
                  <option value="">{t('PARTENAIRE.LIST.SELECT_PLACEHOLDER')}</option>
                  {PARTENAIRE_TYPES.map(type => (
                    <option key={type} value={type}>{t('PARTENAIRE.LIST.TYPES.' + type)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.RESPONSABLE')}</label>
                <input
                  type="text"
                  value={form.responsable}
                  onChange={e => updateField('responsable', e.target.value)}
                  placeholder={t('PARTENAIRE.LIST.RESPONSABLE_PLACEHOLDER')}
                />
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.TELEPHONE')}</label>
                <input type="text" value={form.telephone} onChange={e => updateField('telephone', e.target.value)} placeholder="0600000000" />
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.EMAIL')}</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="contact@partenaire.ma" />
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.ADRESSE')}</label>
                <input type="text" value={form.adresse} onChange={e => updateField('adresse', e.target.value)} placeholder={t('PARTENAIRE.LIST.ADRESSE')} />
              </div>
              <div className="field">
                <label>{t('PARTENAIRE.LIST.PROVINCE')}</label>
                <select value={form.provinceId} onChange={e => updateField('provinceId', e.target.value)}>
                  <option value="">{t('PARTENAIRE.LIST.SELECT_PLACEHOLDER')}</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field mb-2">
              <label>{t('PARTENAIRE.LIST.DESCRIPTION')}</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder={t('PARTENAIRE.LIST.DESCRIPTION_PLACEHOLDER')}
              />
            </div>
            <div className="form-btns">
              <button type="button" className="btn btn-outline" onClick={closeForm}>{t('COMMON.CANCEL')}</button>
              <button type="submit" className="btn btn-primary" disabled={isInvalid || saving}>
                {saving ? <span className="spinner spinner-sm" /> : t(editingId ? 'COMMON.SAVE' : 'PARTENAIRE.LIST.CREATE')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="siipe-card">
          <div className="table-meta">
            <span className="text-secondary">{filtered.length} {t('PARTENAIRE.LIST.COUNT_SUFFIX')}</span>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('PARTENAIRE.LIST.NOM')}</th>
                  <th>{t('PARTENAIRE.LIST.TYPE')}</th>
                  <th>{t('PARTENAIRE.LIST.RESPONSABLE')}</th>
                  <th>{t('PARTENAIRE.LIST.TELEPHONE')}</th>
                  <th>{t('PARTENAIRE.LIST.EMAIL')}</th>
                  <th>{t('PARTENAIRE.LIST.PROVINCE')}</th>
                  <th>{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="name-cell">
                        <strong>{p.nomFr}</strong>
                        {p.nomAr && <div className="sub-text">{p.nomAr}</div>}
                      </div>
                    </td>
                    <td><span className="chip">{formatType(p.type)}</span></td>
                    <td>{p.responsable || '-'}</td>
                    <td>{p.telephone || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.provinceNom || '-'}</td>
                    <td className="actions">
                      {canEdit() && (
                        <button className="action-btn edit" title={t('COMMON.EDIT')} onClick={() => openEditForm(p)}>
                          <Icon name="edit" />
                        </button>
                      )}
                      {canDelete() && (
                        <button className="action-btn delete" title={t('COMMON.DELETE')} onClick={() => handleDelete(p)}>
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">{t('PARTENAIRE.LIST.EMPTY')}</td>
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
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4);
          align-items: end;
        }
        .filter-reset { justify-content: flex-end; }
        .form-title { font-size: var(--font-md); font-weight: 700; margin-bottom: var(--space-4); }
        .form-btns { display: flex; justify-content: flex-end; gap: var(--space-2); }
        .err { color: var(--color-danger); font-size: var(--font-xs); }
        .table-meta { margin-bottom: var(--space-3); }
        .name-cell strong { display: block; }
        .sub-text { font-size: var(--font-xs); color: var(--color-text-tertiary); direction: rtl; }
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
