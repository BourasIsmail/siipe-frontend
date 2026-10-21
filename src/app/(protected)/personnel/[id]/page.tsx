'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Personnel } from '@/lib/models/personnel.model';

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f'];

type Tab = 'identite' | 'profil' | 'evaluation';

function formatDate(date?: string): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatNumber(n?: number): string {
  if (n == null) return '-';
  return n.toLocaleString('fr-FR');
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getFileUrl(path: string): string {
  return `http://localhost:8080/api/files?path=${path}`;
}

export default function PersonnelDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { canEditPersonnel } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('identite');
  const [avatarColor, setAvatarColor] = useState('#2e7d32');

  useEffect(() => {
    if (!id) return;
    api.getPersonnelById(Number(id))
      .then(p => {
        setPersonnel(p);
        const idx = (p.nom.charCodeAt(0) + p.prenom.charCodeAt(0)) % AVATAR_COLORS.length;
        setAvatarColor(AVATAR_COLORS[idx]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function formatEnum(val: string | undefined, group: string): string {
    if (!val) return '-';
    const key = `PERSONNEL.DETAIL.${group}.${val}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return humanize(val);
  }

  const evalItems = personnel ? [
    { label: t('PERSONNEL.DETAIL.EVAL.ORGANISATION'), value: personnel.organisation },
    { label: t('PERSONNEL.DETAIL.EVAL.ACTIVITE'), value: personnel.activite },
    { label: t('PERSONNEL.DETAIL.EVAL.SPECIALISATION'), value: personnel.specialisation },
    { label: t('PERSONNEL.DETAIL.EVAL.INITIATIVE'), value: personnel.initiative },
    { label: t('PERSONNEL.DETAIL.EVAL.AUTONOMIE'), value: personnel.autonomie },
    { label: t('PERSONNEL.DETAIL.EVAL.ADAPTATION_PROFESSIONNELLE'), value: personnel.adaptationProfessionnelle },
    { label: t('PERSONNEL.DETAIL.EVAL.RELATIONS_TRAVAIL'), value: personnel.relationsTravail },
    { label: t('PERSONNEL.DETAIL.EVAL.TECHNIQUE_EXECUTION'), value: personnel.techniqueExecution },
    { label: t('PERSONNEL.DETAIL.EVAL.COMMUNICATION'), value: personnel.communication },
    { label: t('PERSONNEL.DETAIL.EVAL.TOLERANCE_STRESS'), value: personnel.toleranceStress },
    { label: t('PERSONNEL.DETAIL.EVAL.ASSIDUITE_POINTAGE'), value: personnel.assiduitePointage },
    { label: t('PERSONNEL.DETAIL.EVAL.SERVICE_POPULATION'), value: personnel.servicePopulation }
  ] : [];

  const scores = evalItems.map(i => i.value || 0).filter(v => v > 0);
  const overallScore = scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;

  const observations = personnel ? [
    personnel.observation1 || '',
    personnel.observation2 || '',
    personnel.observation3 || ''
  ] : [];
  const hasObservations = observations.some(o => o.length > 0);

  function getScoreColor(score: number): string {
    if (score >= 4) return '#2e7d32';
    if (score >= 3) return '#f57c00';
    if (score >= 2) return '#e65100';
    return '#c62828';
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !personnel) return;
    try {
      const updated = await api.uploadPersonnelPhoto(personnel.id, file);
      setPersonnel(updated);
      showSuccess(t('PERSONNEL.DETAIL.PHOTO_UPDATED'));
    } catch {
      showError(t('PERSONNEL.DETAIL.PHOTO_UPLOAD_ERROR'));
    } finally {
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!personnel) return null;

  return (
    <div className="personnel-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <div className="avatar avatar-large" style={{ background: avatarColor }}>
            {personnel.nom.charAt(0)}{personnel.prenom.charAt(0)}
          </div>
          <div>
            <h1>{personnel.nom} {personnel.prenom}</h1>
            <div className="meta-row">
              <span className="chip">{formatEnum(personnel.grade, 'GRADES')}</span>
              <span className="status-chip active">{formatEnum(personnel.fonction, 'FONCTIONS')}</span>
              <span className="text-secondary">{personnel.matricule}</span>
            </div>
            <div className="meta-row mt-1">
              <Icon name="business" className="meta-icon" />
              <span className="text-secondary">{personnel.etablissementCentreNom || '-'}</span>
              {personnel.provinceNom && (
                <>
                  <Icon name="location_on" className="meta-icon" />
                  <span className="text-secondary">{personnel.provinceNom}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link className="btn btn-outline" href="/personnel">
            <Icon name="arrow_back" /> {t('COMMON.BACK')}
          </Link>
          {canEditPersonnel() && (
            <Link className="btn btn-primary" href={`/personnel/${personnel.id}/edit`}>
              <Icon name="edit" /> {t('COMMON.EDIT')}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${activeTab === 'identite' ? ' active' : ''}`} onClick={() => setActiveTab('identite')}>
          <Icon name="person" /> {t('PERSONNEL.DETAIL.TAB_IDENTITE')}
        </button>
        <button className={`tab${activeTab === 'profil' ? ' active' : ''}`} onClick={() => setActiveTab('profil')}>
          <Icon name="work" /> {t('PERSONNEL.DETAIL.TAB_PROFIL')}
        </button>
        <button className={`tab${activeTab === 'evaluation' ? ' active' : ''}`} onClick={() => setActiveTab('evaluation')}>
          <Icon name="star" /> {t('PERSONNEL.DETAIL.TAB_EVALUATION')}
        </button>
      </div>

      {/* Tab: Identité */}
      {activeTab === 'identite' && (
        <div className="siipe-card tab-card">
          <div className="info-grid">
            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_INFOS_PERSONNELLES')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.NOM_COMPLET')}</span><strong>{personnel.nom} {personnel.prenom}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.CIN')}</span><strong>{personnel.cin || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.SEXE')}</span><strong>{personnel.sexe ? t(`PERSONNEL.DETAIL.SEXES.${personnel.sexe}`) : '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.DATE_NAISSANCE')}</span><strong>{formatDate(personnel.dateNaissance)}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.LIEU_NAISSANCE')}</span><strong>{personnel.lieuNaissance || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.SITUATION_FAMILLE')}</span><strong>{formatEnum(personnel.situationFamille, 'SITUATIONS_FAMILLE')}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.NOMBRE_ENFANTS')}</span><strong>{personnel.nombreEnfant ?? '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_CONTACT')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.EMAIL')}</span><strong>{personnel.email || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.TELEPHONE')}</span><strong>{personnel.telephone || '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_FORMATION')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.NIVEAU_SCOLAIRE')}</span><strong>{formatEnum(personnel.niveauScolaire, 'NIVEAUX_SCOLAIRE')}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.DIPLOME')}</span><strong>{personnel.diplome || '-'}</strong></div>
            </div>
          </div>

          {canEditPersonnel() && (
            <div className="photo-section">
              <h3>{t('PERSONNEL.DETAIL.PHOTO')}</h3>
              <div className="photo-upload">
                {personnel.photoUrl && (
                  <img src={getFileUrl(personnel.photoUrl)} className="photo-preview" alt={t('PERSONNEL.DETAIL.PHOTO')} />
                )}
                <div className="upload-zone">
                  <label className="upload-btn">
                    <Icon name="upload" />
                    <span>{t(personnel.photoUrl ? 'PERSONNEL.DETAIL.CHANGE_PHOTO' : 'PERSONNEL.DETAIL.ADD_PHOTO')}</span>
                    <input type="file" hidden accept="image/*" onChange={uploadPhoto} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Profil professionnel */}
      {activeTab === 'profil' && (
        <div className="siipe-card tab-card">
          <div className="info-grid">
            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_SITUATION_ADMIN')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.MATRICULE')}</span><strong>{personnel.matricule}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.NUM_COUVERTURE_SOCIALE')}</span><strong>{personnel.numCouvertureSociale || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.SITUATION')}</span><strong>{personnel.situationAdministratif || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DATE_RECRUTEMENT')}</span><strong>{formatDate(personnel.dateRecrutement)}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.SALAIRE')}</span><strong className="num-ltr">{personnel.salaire ? `${formatNumber(personnel.salaire)} MAD` : '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_POSTE_GRADE')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.GRADE')}</span><strong>{formatEnum(personnel.grade, 'GRADES')}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.FONCTION')}</span><strong>{formatEnum(personnel.fonction, 'FONCTIONS')}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.POSTE_OCCUPE')}</span><strong>{formatEnum(personnel.posteOccupe, 'POSTES')}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.CATEGORIE')}</span><strong>{personnel.categorie || '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('PERSONNEL.DETAIL.SECTION_AFFECTATION')}</h3>
              <div className="info-row"><span>{t('PERSONNEL.ETABLISSEMENT')}</span><strong>{personnel.etablissementCentreNom || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.PROVINCE')}</span><strong>{personnel.provinceNom || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.PROGRAMME')}</span><strong>{personnel.programmeNom || '-'}</strong></div>
              <div className="info-row"><span>{t('PERSONNEL.DETAIL.PRESTATION')}</span><strong>{personnel.prestationNom || '-'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Évaluation */}
      {activeTab === 'evaluation' && (
        <div className="siipe-card tab-card">
          <div className="eval-header">
            <h3>{t('PERSONNEL.DETAIL.SCORES_EVALUATION')}</h3>
            <div className="overall-score">
              <div className="score-circle" style={{ background: getScoreColor(overallScore) }}>
                {overallScore.toFixed(1)}
              </div>
              <span className="text-secondary">{t('PERSONNEL.DETAIL.SCORE_GLOBAL')}</span>
            </div>
          </div>

          <div className="eval-grid">
            {evalItems.map((item, i) => (
              <div className="eval-item" key={i}>
                <div className="eval-label">{item.label}</div>
                <div className="eval-bar-wrap">
                  <div
                    className="eval-bar"
                    style={{ width: `${(item.value || 0) * 20}%`, background: getScoreColor(item.value || 0) }}
                  />
                </div>
                <div className="eval-score">{item.value ?? '-'}/5</div>
              </div>
            ))}
          </div>

          {hasObservations && (
            <div className="observations mt-3">
              <h3>{t('PERSONNEL.DETAIL.OBSERVATIONS')}</h3>
              <div className="obs-grid">
                {observations.map((obs, i) => obs && (
                  <div className="obs-item" key={i}>
                    <div className="obs-label">{t('PERSONNEL.DETAIL.OBSERVATION_N', { n: i + 1 })}</div>
                    <div className="obs-text">{obs}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit */}
      <div className="audit-info">
        <span>{t('PERSONNEL.DETAIL.CREATED_BY', { name: personnel.createdBy, date: formatDate(personnel.createdAt) })}</span>
        {personnel.updatedAt && (
          <span> — {t('PERSONNEL.DETAIL.UPDATED_AT', { date: formatDate(personnel.updatedAt) })}</span>
        )}
      </div>

      <style jsx>{`
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .avatar-large { width: 72px; height: 72px; font-size: 24px; }
        h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 8px; }
        .meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .meta-row :global(.meta-icon) { font-size: 16px; width: 16px; color: var(--color-text-tertiary); }
        .mt-1 { margin-top: 6px; }
        .header-actions { display: flex; gap: 8px; }
        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          border-bottom: 2px solid var(--color-border);
        }
        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-secondary);
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          font-family: inherit;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }
        .tab:hover { background: var(--color-surface-2); color: var(--color-primary); }
        .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
        .tab :global(.material-icons) { font-size: 18px; width: 18px; }
        .tab-card { border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg) !important; }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }
        .info-section h3 {
          color: var(--color-primary);
          font-size: 14px;
          font-weight: 600;
          border-bottom: 1px solid var(--color-primary-surface);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid var(--color-surface-2);
          font-size: 14px;
        }
        .info-row span { color: var(--color-text-secondary); }
        .info-row strong { color: var(--color-text); text-align: end; max-width: 60%; }
        .photo-section { margin-top: 24px; }
        .photo-section h3 { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }
        .photo-upload { display: flex; align-items: center; gap: 16px; }
        .photo-preview { width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; }
        .upload-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 10px 16px;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: 14px;
        }
        .upload-btn :global(.material-icons) { font-size: 20px; width: 20px; }
        .upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

        .eval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .eval-header h3 { color: var(--color-primary); font-size: 16px; }
        .overall-score { display: flex; align-items: center; gap: 12px; }
        .score-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        .eval-grid { display: flex; flex-direction: column; gap: 12px; }
        .eval-item { display: flex; align-items: center; gap: 12px; }
        .eval-label { width: 220px; font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
        .eval-bar-wrap { flex: 1; height: 10px; background: var(--color-surface-2); border-radius: 5px; overflow: hidden; }
        .eval-bar { height: 100%; border-radius: 5px; transition: width 0.3s; }
        .eval-score { width: 40px; text-align: end; font-size: 14px; font-weight: 600; color: var(--color-text); }
        .observations h3 { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }
        .obs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
        .obs-item { background: var(--color-surface-2); border-radius: var(--radius-md); padding: 12px; }
        .obs-label { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 4px; }
        .obs-text { font-size: 14px; color: var(--color-text); }
        .audit-info {
          margin-top: 16px;
          font-size: 12px;
          color: var(--color-text-tertiary);
          text-align: end;
          padding-bottom: 32px;
        }
      `}</style>
    </div>
  );
}
