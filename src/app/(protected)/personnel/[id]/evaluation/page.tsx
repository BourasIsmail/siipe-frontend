'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Personnel } from '@/lib/models/personnel.model';

interface EvalCritere {
  key: string;
  obsKey: 'observation1' | 'observation2' | 'observation3';
}

const CRITERES: EvalCritere[] = [
  { key: 'organisation', obsKey: 'observation1' },
  { key: 'activite', obsKey: 'observation1' },
  { key: 'specialisation', obsKey: 'observation2' },
  { key: 'initiative', obsKey: 'observation2' },
  { key: 'autonomie', obsKey: 'observation2' },
  { key: 'adaptationProfessionnelle', obsKey: 'observation2' },
  { key: 'relationsTravail', obsKey: 'observation3' },
  { key: 'techniqueExecution', obsKey: 'observation3' },
  { key: 'communication', obsKey: 'observation3' },
  { key: 'toleranceStress', obsKey: 'observation3' },
  { key: 'assiduitePointage', obsKey: 'observation3' },
  { key: 'servicePopulation', obsKey: 'observation3' }
];

export default function PersonnelEvaluationPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    api.getPersonnelById(Number(id))
      .then(p => {
        setPersonnel(p);
        setScores({
          organisation: p.organisation || 0,
          activite: p.activite || 0,
          specialisation: p.specialisation || 0,
          initiative: p.initiative || 0,
          autonomie: p.autonomie || 0,
          adaptationProfessionnelle: p.adaptationProfessionnelle || 0,
          relationsTravail: p.relationsTravail || 0,
          techniqueExecution: p.techniqueExecution || 0,
          communication: p.communication || 0,
          toleranceStress: p.toleranceStress || 0,
          assiduitePointage: p.assiduitePointage || 0,
          servicePopulation: p.servicePopulation || 0
        });
        setObservations({
          observation1: p.observation1 || '',
          observation2: p.observation2 || '',
          observation3: p.observation3 || ''
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const totalScore = Object.values(scores).reduce((sum, v) => sum + (v || 0), 0);
  const maxScore = CRITERES.length * 5;
  const pct = maxScore > 0 ? totalScore / maxScore : 0;

  function getCriterionLabel(key: string): string {
    return t(`PERSONNEL.EVALUATION.CRITERES.${key}.LABEL`);
  }

  function getCriterionDescription(key: string): string {
    return t(`PERSONNEL.EVALUATION.CRITERES.${key}.DESCRIPTION`);
  }

  function getTotalColor(): string {
    if (pct >= 0.8) return '#2e7d32';
    if (pct >= 0.6) return '#f57c00';
    if (pct >= 0.4) return '#e65100';
    return '#c62828';
  }

  function getAppreciation(): string {
    if (pct >= 0.8) return t('PERSONNEL.EVALUATION.APPRECIATIONS.TRES_BIEN');
    if (pct >= 0.6) return t('PERSONNEL.EVALUATION.APPRECIATIONS.BIEN');
    if (pct >= 0.4) return t('PERSONNEL.EVALUATION.APPRECIATIONS.ASSEZ_BIEN');
    return t('PERSONNEL.EVALUATION.APPRECIATIONS.INSUFFISANT');
  }

  function setScore(key: string, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
  }

  function setObservation(key: string, value: string) {
    setObservations(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!personnel) return;
    setSaving(true);
    const data = { ...scores, ...observations };
    try {
      await api.updatePersonnel(personnel.id, { ...personnel, ...data });
      setSaving(false);
      showSuccess(t('PERSONNEL.EVALUATION.SAVED'));
      router.push(`/personnel/${personnel.id}`);
    } catch {
      setSaving(false);
      showError(t('COMMON.ERROR'));
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
    <div className="personnel-evaluation">
      <div className="page-header">
        <button className="btn btn-outline" onClick={() => router.push(`/personnel/${personnel.id}`)}>
          <Icon name="arrow_back" /> {t('COMMON.BACK')}
        </button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner small" /> : <Icon name="save" />}
          {saving ? t('PERSONNEL.EVALUATION.SAVING') : t('COMMON.SAVE')}
        </button>
      </div>

      <div className="siipe-card">
        <div className="eval-title">{t('PERSONNEL.EVALUATION.SHEET_TITLE')}</div>
        <div className="eval-subtitle">{personnel.nom} {personnel.prenom} — {personnel.matricule}</div>

        <div className="table-card eval-table-wrap">
          <table className="eval-table">
            <thead>
              <tr>
                <th className="col-competence">{t('PERSONNEL.EVALUATION.COMPETENCES')}</th>
                {[1, 2, 3, 4, 5].map(n => <th className="col-note" key={n}>{n}</th>)}
                <th className="col-total">{t('PERSONNEL.EVALUATION.TOTAL_POINTS')}</th>
                <th className="col-obs">
                  {t('PERSONNEL.EVALUATION.COMMENT_OBSERVATION')}<br />
                  <small>{t('PERSONNEL.EVALUATION.ACTIONS_RECOMMENDATION')}</small>
                </th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th colSpan={5} className="cote-header">{t('PERSONNEL.EVALUATION.APPRECIATION_SCALE')}</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {CRITERES.map(c => (
                <tr key={c.key}>
                  <td className="col-competence">
                    <div className="competence-label">{getCriterionLabel(c.key)}</div>
                    <div className="competence-desc">{getCriterionDescription(c.key)}</div>
                  </td>
                  {[1, 2, 3, 4, 5].map(n => (
                    <td className="col-note" key={n}>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={c.key}
                          value={n}
                          checked={scores[c.key] === n}
                          onChange={() => setScore(c.key, n)}
                        />
                        <span className={`radio-custom${scores[c.key] === n ? ' checked' : ''}`}></span>
                      </label>
                    </td>
                  ))}
                  <td className="col-total">
                    {scores[c.key] ? <strong>{scores[c.key]}</strong> : <span className="text-secondary">—</span>}
                  </td>
                  <td className="col-obs">
                    <textarea
                      value={observations[c.obsKey]}
                      onChange={e => setObservation(c.obsKey, e.target.value)}
                      rows={3}
                      className="obs-textarea"
                      placeholder={t('PERSONNEL.EVALUATION.OBSERVATION_PLACEHOLDER')}
                    />
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="total-row">
                <td className="col-competence"><strong>{t('PERSONNEL.EVALUATION.TOTAL_GENERAL')}</strong></td>
                <td colSpan={5}></td>
                <td className="col-total">
                  <strong className="total-score" style={{ color: getTotalColor() }}>{totalScore}</strong>
                  <div className="text-secondary" style={{ fontSize: 11 }}>/ {maxScore}</div>
                </td>
                <td className="col-obs">
                  <div className="score-badge" style={{ background: getTotalColor() }}>
                    {getAppreciation()}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .eval-title {
          text-align: center;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .eval-subtitle {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-bottom: 20px;
        }
        .eval-table-wrap { overflow-x: auto; }
        .eval-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .eval-table th, .eval-table td {
          border: 1px solid var(--color-border);
          padding: 8px 10px;
          vertical-align: middle;
        }
        .eval-table thead th {
          background: var(--color-surface-2);
          color: var(--color-text-tertiary);
          text-align: center;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .sub-header th { background: var(--color-surface-2); font-size: 11px; }
        .cote-header { text-align: center; }
        .col-competence { width: 30%; text-align: start; }
        .col-note { width: 6%; text-align: center; }
        .col-total { width: 8%; text-align: center; }
        .col-obs { width: 22%; }
        .competence-label { font-weight: 600; color: var(--color-text); margin-bottom: 4px; font-size: 13px; }
        .competence-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }
        .radio-label { display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .radio-label input[type='radio'] { display: none; }
        .radio-custom {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          background: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }
        .radio-custom.checked { border-color: var(--color-primary); background: var(--color-primary); }
        .radio-custom.checked::after { content: '✓'; color: white; font-size: 12px; font-weight: 700; }
        .obs-textarea {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px 8px;
          font-size: 12px;
          font-family: inherit;
          resize: vertical;
          min-height: 60px;
          color: var(--color-text);
        }
        .obs-textarea:focus { outline: none; border-color: var(--color-primary); }
        .total-row td { background: var(--color-surface-2); }
        .total-score { font-size: 20px; color: var(--color-primary); }
        .score-badge {
          color: white;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          text-align: center;
          font-weight: 600;
          font-size: 13px;
        }
        .spinner.small { width: 16px; height: 16px; border-width: 2px; border-color: rgba(255,255,255,0.4); border-top-color: white; margin-inline-end: 6px; }
      `}</style>
    </div>
  );
}
