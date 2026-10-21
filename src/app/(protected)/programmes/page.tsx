'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Programme, Prestation } from '@/lib/models/etablissement.model';

interface ProgrammeFormState {
  nomFr: string;
  nomAr: string;
  description: string;
}

const emptyProgrammeForm: ProgrammeFormState = { nomFr: '', nomAr: '', description: '' };
const emptyPrestationForm: ProgrammeFormState = { nomFr: '', nomAr: '', description: '' };

export default function ProgrammesPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [prestationsMap, setPrestationsMap] = useState<Record<number, Prestation[]>>({});
  const [loading, setLoading] = useState(true);

  const [showProgrammeForm, setShowProgrammeForm] = useState(false);
  const [savingProgramme, setSavingProgramme] = useState(false);
  const [editingProgrammeId, setEditingProgrammeId] = useState<number | null>(null);
  const [programmeForm, setProgrammeForm] = useState<ProgrammeFormState>(emptyProgrammeForm);
  const [programmeTouched, setProgrammeTouched] = useState({ nomFr: false, nomAr: false });

  const [addingPrestationForProgramme, setAddingPrestationForProgramme] = useState<number | null>(null);
  const [savingPrestation, setSavingPrestation] = useState(false);
  const [prestationForm, setPrestationForm] = useState<ProgrammeFormState>(emptyPrestationForm);
  const [prestationTouched, setPrestationTouched] = useState({ nomFr: false, nomAr: false });

  useEffect(() => {
    loadProgrammes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadProgrammes() {
    setLoading(true);
    api.getProgrammes()
      .then(async (data: Programme[]) => {
        setProgrammes(data);
        if (data.length === 0) {
          setPrestationsMap({});
          setLoading(false);
          return;
        }
        const entries = await Promise.all(
          data.map(p =>
            api.getPrestationsByProgramme(p.id)
              .then((pr: Prestation[]) => [p.id, pr] as const)
              .catch(() => [p.id, [] as Prestation[]] as const)
          )
        );
        const map: Record<number, Prestation[]> = {};
        entries.forEach(([id, pr]) => { map[id] = pr; });
        setPrestationsMap(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function getPrestations(programmeId: number): Prestation[] {
    return prestationsMap[programmeId] || [];
  }

  function openProgrammeForm() {
    setEditingProgrammeId(null);
    setProgrammeForm(emptyProgrammeForm);
    setProgrammeTouched({ nomFr: false, nomAr: false });
    setShowProgrammeForm(true);
  }

  function openEditProgramme(p: Programme) {
    setEditingProgrammeId(p.id);
    setProgrammeForm({ nomFr: p.nomFr, nomAr: p.nomAr, description: p.description || '' });
    setProgrammeTouched({ nomFr: false, nomAr: false });
    setShowProgrammeForm(true);
  }

  function closeProgrammeForm() {
    setShowProgrammeForm(false);
    setEditingProgrammeId(null);
    setProgrammeForm(emptyProgrammeForm);
  }

  const programmeFormInvalid = !programmeForm.nomFr.trim() || !programmeForm.nomAr.trim();

  async function onSubmitProgramme(e: React.FormEvent) {
    e.preventDefault();
    setProgrammeTouched({ nomFr: true, nomAr: true });
    if (programmeFormInvalid) return;
    setSavingProgramme(true);
    try {
      const payload = {
        nomFr: programmeForm.nomFr,
        nomAr: programmeForm.nomAr,
        description: programmeForm.description
      };
      if (editingProgrammeId) {
        const updated = await api.updateProgramme(editingProgrammeId, payload);
        setProgrammes(prev => prev.map(x => (x.id === updated.id ? updated : x)));
        showSuccess(t('PROGRAMME.UPDATED'));
      } else {
        const created = await api.createProgramme(payload);
        setProgrammes(prev => [...prev, created]);
        setPrestationsMap(prev => ({ ...prev, [created.id]: [] }));
        showSuccess(t('PROGRAMME.CREATED'));
      }
      setSavingProgramme(false);
      closeProgrammeForm();
    } catch {
      setSavingProgramme(false);
      showError(t('COMMON.ERROR'));
    }
  }

  async function deleteProgramme(p: Programme) {
    if (!window.confirm(t('PROGRAMME.CONFIRM_DELETE', { name: p.nomFr }))) return;
    try {
      await api.deleteProgramme(p.id);
      setProgrammes(prev => prev.filter(x => x.id !== p.id));
      setPrestationsMap(prev => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      showSuccess(t('PROGRAMME.DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  function openPrestationForm(programmeId: number) {
    setAddingPrestationForProgramme(programmeId);
    setPrestationForm(emptyPrestationForm);
    setPrestationTouched({ nomFr: false, nomAr: false });
  }

  function closePrestationForm() {
    setAddingPrestationForProgramme(null);
    setPrestationForm(emptyPrestationForm);
  }

  const prestationFormInvalid = !prestationForm.nomFr.trim() || !prestationForm.nomAr.trim();

  async function onSubmitPrestation(e: React.FormEvent, programmeId: number) {
    e.preventDefault();
    setPrestationTouched({ nomFr: true, nomAr: true });
    if (prestationFormInvalid) return;
    setSavingPrestation(true);
    try {
      const created = await api.createPrestation(programmeId, prestationForm);
      setPrestationsMap(prev => ({ ...prev, [programmeId]: [...(prev[programmeId] || []), created] }));
      showSuccess(t('PROGRAMME.PRESTATION_CREATED'));
      setSavingPrestation(false);
      closePrestationForm();
    } catch {
      setSavingPrestation(false);
      showError(t('COMMON.ERROR'));
    }
  }

  async function deletePrestation(pr: Prestation, programmeId: number) {
    if (!window.confirm(t('PROGRAMME.CONFIRM_DELETE_PRESTATION', { name: pr.nomFr }))) return;
    try {
      await api.deletePrestation(pr.id);
      setPrestationsMap(prev => ({
        ...prev,
        [programmeId]: (prev[programmeId] || []).filter(x => x.id !== pr.id)
      }));
      showSuccess(t('PROGRAMME.PRESTATION_DELETED'));
    } catch {
      showError(t('COMMON.ERROR'));
    }
  }

  return (
    <div className="programmes-page">
      <div className="page-header">
        <h1>{t('PROGRAMME.TITLE')}</h1>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={openProgrammeForm}>
            <Icon name="add" /> {t('PROGRAMME.NEW')}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {isAdmin() && showProgrammeForm && (
        <div className="siipe-card mb-2">
          <h3 className="form-card-title">
            {editingProgrammeId ? t('PROGRAMME.FORM_TITLE_EDIT') : t('PROGRAMME.NEW')}
          </h3>
          <form onSubmit={onSubmitProgramme}>
            <div className="form-row">
              <div className="field">
                <label>{t('PROGRAMME.NOM_FR_LABEL')}</label>
                <input
                  type="text"
                  value={programmeForm.nomFr}
                  onChange={e => setProgrammeForm(f => ({ ...f, nomFr: e.target.value }))}
                  onBlur={() => setProgrammeTouched(tch => ({ ...tch, nomFr: true }))}
                  placeholder={t('PROGRAMME.NOM_PLACEHOLDER')}
                />
                {programmeTouched.nomFr && !programmeForm.nomFr.trim() && (
                  <span className="err">{t('PROGRAMME.REQUIRED')}</span>
                )}
              </div>
              <div className="field">
                <label>{t('PROGRAMME.NOM_AR_LABEL')}</label>
                <input
                  type="text"
                  dir="rtl"
                  value={programmeForm.nomAr}
                  onChange={e => setProgrammeForm(f => ({ ...f, nomAr: e.target.value }))}
                  onBlur={() => setProgrammeTouched(tch => ({ ...tch, nomAr: true }))}
                  placeholder="اسم البرنامج"
                />
                {programmeTouched.nomAr && !programmeForm.nomAr.trim() && (
                  <span className="err">{t('PROGRAMME.REQUIRED')}</span>
                )}
              </div>
            </div>
            <div className="field mb-2">
              <label>{t('PROGRAMME.DESCRIPTION')}</label>
              <textarea
                rows={2}
                value={programmeForm.description}
                onChange={e => setProgrammeForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t('PROGRAMME.DESCRIPTION_PLACEHOLDER')}
              />
            </div>
            <div className="form-btns">
              <button type="button" className="btn btn-outline" onClick={closeProgrammeForm}>
                {t('COMMON.CANCEL')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={programmeFormInvalid || savingProgramme}>
                {savingProgramme ? (
                  <span className="spinner spinner-sm" />
                ) : (
                  editingProgrammeId ? t('COMMON.SAVE') : t('PROGRAMME.CREATE')
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <div className="programmes-grid">
          {programmes.map(p => (
            <div key={p.id} className="siipe-card programme-card">
              <div className="programme-header">
                <div>
                  <h3>{p.nomFr}</h3>
                  <div className="nomAr">{p.nomAr}</div>
                  {p.description && <div className="description text-secondary">{p.description}</div>}
                </div>
                {isAdmin() && (
                  <div className="programme-actions">
                    <button className="action-btn edit" onClick={() => openEditProgramme(p)} title={t('COMMON.EDIT')}>
                      <Icon name="edit" />
                    </button>
                    <button className="action-btn delete" onClick={() => deleteProgramme(p)} title={t('COMMON.DELETE')}>
                      <Icon name="delete" />
                    </button>
                  </div>
                )}
              </div>

              <div className="prestations-section">
                <div className="prestations-header">
                  <span className="chip">{getPrestations(p.id).length} {t('PROGRAMME.PRESTATIONS_COUNT_SUFFIX')}</span>
                  {isAdmin() && (
                    <button className="btn-add-prest" onClick={() => openPrestationForm(p.id)}>
                      <Icon name="add" /> {t('PROGRAMME.ADD_PRESTATION')}
                    </button>
                  )}
                </div>

                {isAdmin() && addingPrestationForProgramme === p.id && (
                  <div className="prestation-form">
                    <form onSubmit={e => onSubmitPrestation(e, p.id)}>
                      <div className="form-row-sm">
                        <div className="field">
                          <label>{t('PROGRAMME.NOM_FR_LABEL')}</label>
                          <input
                            type="text"
                            value={prestationForm.nomFr}
                            onChange={e => setPrestationForm(f => ({ ...f, nomFr: e.target.value }))}
                            onBlur={() => setPrestationTouched(tch => ({ ...tch, nomFr: true }))}
                            placeholder={t('PROGRAMME.PRESTATION_NOM_PLACEHOLDER')}
                          />
                          {prestationTouched.nomFr && !prestationForm.nomFr.trim() && (
                            <span className="err">{t('PROGRAMME.REQUIRED')}</span>
                          )}
                        </div>
                        <div className="field">
                          <label>{t('PROGRAMME.NOM_AR_LABEL')}</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={prestationForm.nomAr}
                            onChange={e => setPrestationForm(f => ({ ...f, nomAr: e.target.value }))}
                            onBlur={() => setPrestationTouched(tch => ({ ...tch, nomAr: true }))}
                            placeholder="اسم الخدمة"
                          />
                          {prestationTouched.nomAr && !prestationForm.nomAr.trim() && (
                            <span className="err">{t('PROGRAMME.REQUIRED')}</span>
                          )}
                        </div>
                        <div className="field">
                          <label>{t('PROGRAMME.DESCRIPTION')}</label>
                          <input
                            type="text"
                            value={prestationForm.description}
                            onChange={e => setPrestationForm(f => ({ ...f, description: e.target.value }))}
                            placeholder={t('PROGRAMME.PRESTATION_DESCRIPTION_PLACEHOLDER')}
                          />
                        </div>
                      </div>
                      <div className="form-btns-sm">
                        <button type="button" className="btn btn-ghost" onClick={closePrestationForm}>
                          {t('COMMON.CANCEL')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={prestationFormInvalid || savingPrestation}>
                          {savingPrestation ? t('PROGRAMME.SAVING') : t('PROGRAMME.CREATE_PRESTATION')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="prestations-list">
                  {getPrestations(p.id).map(pr => (
                    <div key={pr.id} className="prestation-item">
                      <div className="prestation-info">
                        <Icon name="check_circle" className="prest-icon" />
                        <div>
                          <span className="prestation-nom">{pr.nomFr}</span>
                          {pr.nomAr && <span className="prestation-nom-ar"> — {pr.nomAr}</span>}
                          {pr.description && (
                            <div className="text-secondary" style={{ fontSize: 12 }}>{pr.description}</div>
                          )}
                        </div>
                      </div>
                      {isAdmin() && (
                        <button className="action-btn-sm delete" onClick={() => deletePrestation(pr, p.id)} title={t('COMMON.DELETE')}>
                          <Icon name="close" />
                        </button>
                      )}
                    </div>
                  ))}
                  {getPrestations(p.id).length === 0 && (
                    <div className="empty-prestations">
                      <Icon name="info" /> {t('PROGRAMME.EMPTY_PRESTATIONS')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {programmes.length === 0 && (
            <div className="empty-state">
              <Icon name="category" />
              <p>{t('PROGRAMME.EMPTY')}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .programmes-grid { display: flex; flex-direction: column; gap: var(--space-4); }
        .programme-card { border-inline-start: 4px solid var(--color-primary); }
        .form-card-title { font-size: var(--font-md); margin-bottom: var(--space-4); }
        .programme-header {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
        }
        .programme-header h3 { font-size: var(--font-md); color: var(--color-primary); margin-bottom: 4px; }
        .nomAr { font-size: var(--font-base); color: var(--color-text-tertiary); direction: rtl; margin-bottom: 4px; }
        .description { font-size: var(--font-sm); margin-top: 4px; }
        .programme-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
          cursor: pointer; background: transparent; color: var(--color-text-secondary);
        }
        .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
        .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
        .action-btn :global(.material-icons) { font-size: 18px; }
        .prestations-section {
          background: var(--color-surface-2); border-radius: var(--radius-md); padding: 14px;
        }
        .prestations-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
        }
        .btn-add-prest {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: 1px dashed var(--color-primary); color: var(--color-primary);
          padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-sm); font-family: inherit;
        }
        .btn-add-prest:hover { background: var(--color-primary-surface); }
        .btn-add-prest :global(.material-icons) { font-size: 16px; }
        .prestation-form {
          background: var(--color-white); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;
          border: 1px solid var(--color-primary-surface);
        }
        .form-row-sm {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .mb-2 { margin-bottom: 12px; }
        .form-btns, .form-btns-sm { display: flex; justify-content: flex-end; gap: var(--space-2); }
        .prestations-list { display: flex; flex-direction: column; gap: 8px; }
        .prestation-item {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--color-white); border-radius: var(--radius-md); padding: 10px 14px;
          border: 1px solid var(--color-border);
        }
        .prestation-info { display: flex; align-items: center; gap: 10px; flex: 1; }
        .prestation-info :global(.prest-icon) { font-size: 18px; color: var(--color-primary); flex-shrink: 0; }
        .prestation-nom { font-size: var(--font-base); font-weight: 500; color: var(--color-text); }
        .prestation-nom-ar { font-size: var(--font-sm); color: var(--color-text-tertiary); }
        .action-btn-sm {
          display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border: none; border-radius: 4px;
          cursor: pointer; background: transparent; color: var(--color-text-tertiary); flex-shrink: 0;
        }
        .action-btn-sm.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
        .action-btn-sm :global(.material-icons) { font-size: 16px; }
        .empty-prestations {
          display: flex; align-items: center; gap: 6px;
          font-size: var(--font-sm); color: var(--color-text-tertiary); padding: 8px; justify-content: center;
        }
        .empty-prestations :global(.material-icons) { font-size: 16px; }
        .err { color: var(--color-danger); font-size: var(--font-xs); }
        .empty-state {
          text-align: center; padding: 60px; color: var(--color-text-tertiary); background: var(--color-white);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
        }
        .empty-state :global(.material-icons) { font-size: 56px; display: block; margin: 0 auto 12px; }
        .empty-state p { font-size: var(--font-md); }
        .spinner-sm {
          width: 16px; height: 16px; border-width: 2px; display: inline-block; margin-inline-end: 6px;
        }
      `}</style>
    </div>
  );
}
