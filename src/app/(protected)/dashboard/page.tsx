'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/Icon';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const COLORS = ['#1a7a4c', '#b9872f', '#2458c4', '#7b3fc4', '#8a2f55', '#4aab80', '#dbb04d', '#5c9ad6', '#a885d8', '#b3443a'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getDashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function translateEnum(key: string, value: string): string {
    const translated = t(key + value);
    if (translated !== key + value) return translated;
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  const monthlyChart = useMemo(() => {
    if (!data) return null;
    const months = Object.keys(data.beneficiairesByMonth || {});
    const values = months.map(m => data.beneficiairesByMonth[m]);
    const peakIndex = values.indexOf(Math.max(...values));
    return {
      labels: months,
      datasets: [{
        data: values,
        backgroundColor: values.map((_: number, i: number) => i === peakIndex ? '#1a7a4c' : '#e6e1d4'),
        borderRadius: 4
      }]
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const situationChart = useMemo(() => {
    if (!data) return null;
    const situations = Object.keys(data.beneficiairesBySituationDifficulte || {});
    return {
      labels: situations.map(s => translateEnum('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.', s)),
      datasets: [{ data: situations.map(s => data.beneficiairesBySituationDifficulte[s]), backgroundColor: COLORS }]
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang]);

  const gradeChart = useMemo(() => {
    if (!data) return null;
    const grades = Object.keys(data.personnelByGrade || {}).slice(0, 8);
    return {
      labels: grades.map(g => translateEnum('PERSONNEL.FORM.GRADES.', g)),
      datasets: [{ data: grades.map(g => data.personnelByGrade[g]), backgroundColor: '#2458c4' }]
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang]);

  const provinceChart = useMemo(() => {
    if (!data) return null;
    const provinces = Object.keys(data.etablissementsByProvince || {});
    return {
      labels: provinces,
      datasets: [{ data: provinces.map(p => data.etablissementsByProvince[p]), backgroundColor: COLORS }]
    };
  }, [data]);

  const barOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };
  const pieOptions = { responsive: true, plugins: { legend: { position: 'right' as const } } };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>{t('DASHBOARD.TITLE')}</h1>
        <span className="text-secondary">{t('DASHBOARD.WELCOME')}, {user?.nom} {user?.prenom}</span>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 300 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && data && (
        <>
          <div className="stats-grid">
            <div className="stat-card accent-green">
              <div className="stat-card-top"><div className="stat-icon"><Icon name="people" /></div></div>
              <div className="stat-value">{data.totalBeneficiaires.toLocaleString('fr-FR')}</div>
              <div className="stat-label">{t('DASHBOARD.TOTAL_BENEFICIAIRES')}</div>
            </div>

            <div className="stat-card accent-blue">
              <div className="stat-card-top"><div className="stat-icon"><Icon name="badge" /></div></div>
              <div className="stat-value">{data.totalPersonnel.toLocaleString('fr-FR')}</div>
              <div className="stat-label">{t('DASHBOARD.TOTAL_PERSONNEL')}</div>
            </div>

            <div className="stat-card accent-orange">
              <div className="stat-card-top"><div className="stat-icon"><Icon name="business" /></div></div>
              <div className="stat-value">{data.totalEtablissements.toLocaleString('fr-FR')}</div>
              <div className="stat-label">{t('DASHBOARD.TOTAL_ETABLISSEMENTS')}</div>
            </div>

            <div className="stat-card accent-purple">
              <div className="stat-card-top"><div className="stat-icon"><Icon name="handshake" /></div></div>
              <div className="stat-value">{data.totalPartenaires.toLocaleString('fr-FR')}</div>
              <div className="stat-label">{t('DASHBOARD.TOTAL_PARTENAIRES')}</div>
            </div>

            <div className="stat-card accent-red">
              <div className="stat-card-top"><div className="stat-icon"><Icon name="payments" /></div></div>
              <div className="stat-value">{Math.round(data.totalMontantSubventions).toLocaleString('fr-FR')} <span className="unit">MAD</span></div>
              <div className="stat-label">{t('DASHBOARD.MONTANT_SUBVENTIONS')}</div>
            </div>
          </div>

          <h2 className="section-title mt-3">{t('DASHBOARD.STATISTIQUES')}</h2>
          <div className="charts-grid">
            <div className="chart-card siipe-card">
              <h3>{t('DASHBOARD.BENEFICIAIRES_PAR_MOIS')}</h3>
              <div className="chart-wrap">{monthlyChart && <Bar data={monthlyChart} options={barOptions} />}</div>
            </div>

            <div className="chart-card siipe-card">
              <h3>{t('DASHBOARD.BENEFICIAIRES_PAR_SITUATION')}</h3>
              <div className="chart-wrap">{situationChart && <Doughnut data={situationChart} options={pieOptions} />}</div>
            </div>

            <div className="chart-card siipe-card">
              <h3>{t('DASHBOARD.PERSONNEL_PAR_GRADE')}</h3>
              <div className="chart-wrap">{gradeChart && <Bar data={gradeChart} options={barOptions} />}</div>
            </div>

            <div className="chart-card siipe-card">
              <h3>{t('DASHBOARD.ETABLISSEMENTS_PAR_PROVINCE')}</h3>
              <div className="chart-wrap">{provinceChart && <Pie data={provinceChart} options={pieOptions} />}</div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        .section-title {
          font-size: var(--font-lg);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-4);
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-4);
        }
        .chart-card h3 { font-size: var(--font-md); font-weight: 600; color: var(--color-text); margin-bottom: var(--space-4); }
        .chart-wrap { max-height: 250px; }

        .stat-value :global(.unit) { font-size: 13px; font-weight: 600; }

        .accent-green :global(.stat-icon) { background: var(--color-primary-surface); color: var(--color-primary); }
        .accent-blue :global(.stat-icon) { background: #e7eefb; color: #2458c4; }
        .accent-orange :global(.stat-icon) { background: var(--color-accent-surface); color: var(--color-accent); }
        .accent-purple :global(.stat-icon) { background: #f3e9fb; color: #7b3fc4; }
        .accent-red :global(.stat-icon) { background: var(--color-danger-surface); color: var(--color-danger); }
      `}</style>
    </div>
  );
}
