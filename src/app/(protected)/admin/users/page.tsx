'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { User, CreateUserRequest, Role } from '@/lib/models/user.model';
import type { Region, Province } from '@/lib/models/geo.model';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';

interface UserFormState {
  nom: string;
  prenom: string;
  email: string;
  role: Role | '';
  regionId: string;
  provinceId: string;
  etablissementCentreId: string;
}

const emptyForm: UserFormState = {
  nom: '', prenom: '', email: '', role: '', regionId: '', provinceId: '', etablissementCentreId: ''
};

const ROLES: Role[] = [
  'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
  'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE',
  'ROLE_RESPONSABLE_ALERTE', 'ROLE_RESPONSABLE_SIGNALEMENT',
  'ROLE_ASSISTANTE_SOCIALE', 'ROLE_COORDINATION'
];

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f', '#558b2f'];
const PAGE_SIZE = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [all, setAll] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [touched, setTouched] = useState({ nom: false, prenom: false, email: false, role: false, etablissementCentreId: false });

  const [pageIndex, setPageIndex] = useState(0);
  const [filterNom, setFilterNom] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');

  useEffect(() => {
    api.getUsers()
      .then(d => { setAll(d); setLoading(false); })
      .catch(() => setLoading(false));
    api.getRegions().then(r => setRegions(r)).catch(() => {});
    api.getEtablissements().then(e => setEtablissements(e)).catch(() => {});
  }, []);

  const requiresEtablissement = ['ROLE_DIRECTEUR_CENTRALE', 'ROLE_ASSISTANTE_SOCIALE'].includes(form.role);

  const filtered = useMemo(() => {
    return all.filter(u => {
      const nomMatch = !filterNom ||
        `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(filterNom.toLowerCase());
      const roleMatch = !filterRole || u.role === filterRole;
      const activeMatch = !filterActive || String(u.active) === filterActive;
      return nomMatch && roleMatch && activeMatch;
    });
  }, [all, filterNom, filterRole, filterActive]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const paginated = filtered.slice(safePageIndex * PAGE_SIZE, safePageIndex * PAGE_SIZE + PAGE_SIZE);
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const s = Math.max(0, safePageIndex - 2);
    const e = Math.min(totalPages - 1, safePageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  }, [safePageIndex, totalPages]);

  function resetFilter() {
    setFilterNom('');
    setFilterRole('');
    setFilterActive('');
    setPageIndex(0);
  }

  function openForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFilteredProvinces([]);
    setTouched({ nom: false, prenom: false, email: false, role: false, etablissementCentreId: false });
    setShowForm(true);
  }

  async function openEditForm(u: User) {
    setEditingId(u.id);
    setForm({
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role,
      regionId: u.regionId ? String(u.regionId) : '',
      provinceId: u.provinceId ? String(u.provinceId) : '',
      etablissementCentreId: u.etablissementCentreId ? String(u.etablissementCentreId) : ''
    });
    setTouched({ nom: false, prenom: false, email: false, role: false, etablissementCentreId: false });
    setShowForm(true);
    if (u.regionId) {
      try {
        const provinces = await api.getProvincesByRegion(u.regionId);
        setFilteredProvinces(provinces);
      } catch {
        setFilteredProvinces([]);
      }
    } else {
      setFilteredProvinces([]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFilteredProvinces([]);
  }

  async function onRegionChange(regionId: string) {
    setForm(f => ({ ...f, regionId, provinceId: '' }));
    if (!regionId) { setFilteredProvinces([]); return; }
    try {
      const provinces = await api.getProvincesByRegion(Number(regionId));
      setFilteredProvinces(provinces);
    } catch {
      setFilteredProvinces([]);
    }
  }

  function onRoleChange(role: Role | '') {
    const needsEtab = ['ROLE_DIRECTEUR_CENTRALE', 'ROLE_ASSISTANTE_SOCIALE'].includes(role);
    setForm(f => ({ ...f, role, etablissementCentreId: needsEtab ? f.etablissementCentreId : '' }));
  }

  const formInvalid =
    !form.nom.trim() || !form.prenom.trim() || !EMAIL_RE.test(form.email) || !form.role ||
    (requiresEtablissement && !form.etablissementCentreId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nom: true, prenom: true, email: true, role: true, etablissementCentreId: true });
    if (formInvalid) return;
    setSaving(true);
    try {
      const data: CreateUserRequest = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        role: form.role as Role,
        regionId: form.regionId ? Number(form.regionId) : undefined,
        provinceId: form.provinceId ? Number(form.provinceId) : undefined,
        etablissementCentreId: form.etablissementCentreId ? Number(form.etablissementCentreId) : undefined
      };
      if (editingId) {
        const updated = await api.updateUser(editingId, data);
        setAll(prev => prev.map(x => (x.id === updated.id ? updated : x)));
        showSuccess(t('ADMIN.USERS.UPDATED'));
      } else {
        const created = await api.createUser(data);
        setAll(prev => [created, ...prev]);
        showSuccess(t('ADMIN.USERS.CREATED'));
      }
      setSaving(false);
      closeForm();
    } catch (err: any) {
      setSaving(false);
      showError(err?.message || t('COMMON.ERROR'));
    }
  }

  async function deleteUser(u: User) {
    if (!window.confirm(t('ADMIN.USERS.CONFIRM_DELETE', { name: `${u.nom} ${u.prenom}` }))) return;
    try {
      await api.deleteUser(u.id);
      setAll(prev => prev.filter(x => x.id !== u.id));
      showSuccess(t('ADMIN.USERS.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  async function resendEmail(u: User) {
    try {
      await api.resendActivation(u.id);
      showSuccess(t('ADMIN.USERS.EMAIL_RESENT'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function getRoleLabel(role: string): string {
    return role ? t('ADMIN.USERS.ROLES.' + role) : role;
  }

  function getAvatarColor(u: User): string {
    const idx = (u.nom.charCodeAt(0) + u.prenom.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  if (!isAdmin()) {
    return (
      <div className="siipe-card">
        <p>{t('COMMON.ERROR')}</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>{t('ADMIN.USERS.TITLE')}</h1>
        <button className="btn btn-primary" onClick={openForm}>
          <Icon name="person_add" /> {t('COMMON.ADD')}
        </button>
      </div>

      <div className="siipe-card mb-2">
        <div className="filter-grid">
          <div className="field">
            <label>{t('ADMIN.USERS.SEARCH_LABEL')}</label>
            <input
              type="text"
              value={filterNom}
              onChange={e => { setFilterNom(e.target.value); setPageIndex(0); }}
              placeholder={t('ADMIN.USERS.SEARCH_PLACEHOLDER')}
            />
          </div>
          <div className="field">
            <label>{t('ADMIN.USERS.ROLE')}</label>
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPageIndex(0); }}>
              <option value="">{t('COMMON.ALL')}</option>
              {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('ADMIN.USERS.STATUT')}</label>
            <select value={filterActive} onChange={e => { setFilterActive(e.target.value); setPageIndex(0); }}>
              <option value="">{t('COMMON.ALL')}</option>
              <option value="true">{t('ADMIN.USERS.ACTIVE')}</option>
              <option value="false">{t('ADMIN.USERS.INACTIVE')}</option>
            </select>
          </div>
          <div className="field reset-field">
            <button className="btn btn-outline" onClick={resetFilter}>
              <Icon name="clear" /> {t('COMMON.RESET')}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="siipe-card mb-2">
          <h3 className="form-card-title">
            {editingId ? t('ADMIN.USERS.FORM_TITLE_EDIT') : t('ADMIN.USERS.FORM_TITLE_ADD')}
          </h3>
          <form onSubmit={onSubmit}>
            <div className="form-row">
              <div className="field">
                <label>{t('ADMIN.USERS.NOM_LABEL')}</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  onBlur={() => setTouched(tc => ({ ...tc, nom: true }))}
                  placeholder={t('ADMIN.USERS.NOM_PLACEHOLDER')}
                />
                {touched.nom && !form.nom.trim() && <span className="err">{t('ADMIN.USERS.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('ADMIN.USERS.PRENOM_LABEL')}</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  onBlur={() => setTouched(tc => ({ ...tc, prenom: true }))}
                  placeholder={t('ADMIN.USERS.PRENOM_PLACEHOLDER')}
                />
                {touched.prenom && !form.prenom.trim() && <span className="err">{t('ADMIN.USERS.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('ADMIN.USERS.EMAIL_LABEL')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onBlur={() => setTouched(tc => ({ ...tc, email: true }))}
                  placeholder="email@entraide.ma"
                />
                {touched.email && !EMAIL_RE.test(form.email) && <span className="err">{t('ADMIN.USERS.EMAIL_INVALID')}</span>}
              </div>
              <div className="field">
                <label>{t('ADMIN.USERS.ROLE_LABEL')}</label>
                <select
                  value={form.role}
                  onChange={e => onRoleChange(e.target.value as Role | '')}
                  onBlur={() => setTouched(tc => ({ ...tc, role: true }))}
                >
                  <option value="">{t('ADMIN.USERS.SELECT_PLACEHOLDER')}</option>
                  {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                </select>
                {touched.role && !form.role && <span className="err">{t('ADMIN.USERS.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('ADMIN.USERS.REGION')}</label>
                <select value={form.regionId} onChange={e => onRegionChange(e.target.value)}>
                  <option value="">{t('ADMIN.USERS.SELECT_PLACEHOLDER')}</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.nomFr}</option>)}
                </select>
              </div>
              <div className="field">
                <label>{t('ADMIN.USERS.PROVINCE')}</label>
                <select
                  value={form.provinceId}
                  onChange={e => setForm(f => ({ ...f, provinceId: e.target.value }))}
                >
                  <option value="">{t('ADMIN.USERS.SELECT_PLACEHOLDER')}</option>
                  {filteredProvinces.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                </select>
              </div>
              {requiresEtablissement && (
                <div className="field">
                  <label>{t('ADMIN.USERS.ETABLISSEMENT_LABEL')}</label>
                  <select
                    value={form.etablissementCentreId}
                    onChange={e => setForm(f => ({ ...f, etablissementCentreId: e.target.value }))}
                    onBlur={() => setTouched(tc => ({ ...tc, etablissementCentreId: true }))}
                  >
                    <option value="">{t('ADMIN.USERS.SELECT_PLACEHOLDER')}</option>
                    {etablissements.map(e => <option key={e.id} value={e.id}>{e.nomFr}</option>)}
                  </select>
                  {touched.etablissementCentreId && !form.etablissementCentreId && (
                    <span className="err">{t('ADMIN.USERS.REQUIRED')}</span>
                  )}
                </div>
              )}
            </div>
            {!editingId && (
              <div className="form-info">
                <Icon name="info" />
                {t('ADMIN.USERS.ACTIVATION_INFO')}
              </div>
            )}
            <div className="form-btns">
              <button type="button" className="btn btn-outline" onClick={closeForm}>{t('COMMON.CANCEL')}</button>
              <button type="submit" className="btn btn-primary" disabled={formInvalid || saving}>
                {saving ? (
                  <span className="spinner spinner-sm" />
                ) : (
                  editingId ? t('COMMON.SAVE') : t('ADMIN.USERS.CREATE_AND_SEND')
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <div className="siipe-card">
          <div className="table-meta">
            <span className="text-secondary">{filtered.length} {t('ADMIN.USERS.COUNT_SUFFIX')}</span>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('ADMIN.USERS.COL_UTILISATEUR')}</th>
                  <th>{t('ADMIN.USERS.EMAIL')}</th>
                  <th>{t('ADMIN.USERS.ROLE')}</th>
                  <th>{t('ADMIN.USERS.PROVINCE')}</th>
                  <th>{t('ADMIN.USERS.STATUT')}</th>
                  <th>{t('ADMIN.USERS.COL_CREATED_AT')}</th>
                  <th>{t('COMMON.ACTIONS')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar" style={{ background: getAvatarColor(u) }}>
                          {u.nom.charAt(0)}{u.prenom.charAt(0)}
                        </div>
                        <div><strong>{u.nom} {u.prenom}</strong></div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className="chip">{getRoleLabel(u.role)}</span></td>
                    <td>{u.etablissementCentreNom || u.provinceNom || u.regionNom || '-'}</td>
                    <td>
                      <span className={`status-chip ${u.active ? 'active' : 'inactive'}`}>
                        {t(u.active ? 'ADMIN.USERS.ACTIVE' : 'ADMIN.USERS.INACTIVE')}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="actions">
                      <button className="action-btn edit" onClick={() => openEditForm(u)} title={t('COMMON.EDIT')}>
                        <Icon name="edit" />
                      </button>
                      {!u.active && (
                        <button className="action-btn" onClick={() => resendEmail(u)} title={t('ADMIN.USERS.RESEND_EMAIL_TITLE')}>
                          <Icon name="email" />
                        </button>
                      )}
                      <button className="action-btn delete" onClick={() => deleteUser(u)} title={t('COMMON.DELETE')}>
                        <Icon name="delete" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">{t('ADMIN.USERS.EMPTY')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>«</button>
              <button className="page-btn" onClick={() => setPageIndex(safePageIndex - 1)} disabled={safePageIndex === 0}>‹</button>
              {pageNumbers.map(n => (
                <button
                  key={n}
                  className={`page-btn ${n === safePageIndex ? 'active' : ''}`}
                  onClick={() => setPageIndex(n)}
                >
                  {n + 1}
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
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
          gap: var(--space-4); align-items: end;
        }
        .reset-field { justify-content: flex-end; }
        .form-card-title { font-size: var(--font-md); margin-bottom: var(--space-4); }
        .form-info {
          display: flex; align-items: center; gap: 8px;
          background: var(--color-accent-surface); color: var(--color-accent); padding: 10px 14px;
          border-radius: var(--radius-sm); font-size: var(--font-sm); margin-bottom: 16px;
        }
        .form-info :global(.material-icons) { font-size: 18px; }
        .form-btns { display: flex; justify-content: flex-end; gap: var(--space-2); }
        .err { color: var(--color-danger); font-size: var(--font-xs); }
        .table-meta { margin-bottom: var(--space-3); }
        .person-cell { display: flex; align-items: center; gap: 10px; }
        .avatar { width: 36px; height: 36px; font-size: 13px; }
        .actions { display: flex; gap: 4px; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
          cursor: pointer; background: transparent; color: var(--color-text-secondary);
        }
        .action-btn:hover { background: var(--color-surface-2); }
        .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
        .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
        .action-btn :global(.material-icons) { font-size: 18px; }
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
          width: 16px; height: 16px; border-width: 2px; display: inline-block; margin-inline-end: 6px;
        }
      `}</style>
    </div>
  );
}
