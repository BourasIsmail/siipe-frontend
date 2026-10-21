'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';
import type { Personnel } from '@/lib/models/personnel.model';

type Tab = 'info' | 'tech' | 'personnel' | 'docs';

interface DocDef {
  label: string;
  type: string;
  url: string;
}

const DOC_DEFS: { label: string; type: string }[] = [
  { label: 'ETABLISSEMENT.DETAIL.DOC_MAPPE_CADASTRALE', type: 'mappeCadastrale' },
  { label: 'ETABLISSEMENT.DETAIL.DOC_CERTIFICAT_PROPRIETE', type: 'certificatPropriete' },
  { label: 'ETABLISSEMENT.DETAIL.DOC_PLAN_SITUATION', type: 'planSituation' },
  { label: 'ETABLISSEMENT.DETAIL.DOC_PLAN_ARCHITECTURE', type: 'planArchitecture' },
  { label: 'ETABLISSEMENT.DETAIL.DOC_PHOTO', type: 'photo' }
];

function buildDocs(e: any): DocDef[] {
  return DOC_DEFS.map(d => ({ ...d, url: e?.[d.type + 'Url'] || '' }));
}

export default function EtablissementDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasAnyRole } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [etab, setEtab] = useState<EtablissementCentre | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [documents, setDocuments] = useState<DocDef[]>(buildDocs(null));

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [personnelLoaded, setPersonnelLoaded] = useState(false);
  const [personnelCount, setPersonnelCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.getEtablissement(Number(id))
      .then(e => {
        setEtab(e);
        setDocuments(buildDocs(e));
        setLoading(false);
        api.getPersonnel()
          .then(p => setPersonnelCount(p.filter((x: Personnel) => x.etablissementCentreId === e.id).length))
          .catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [id]);

  function canEdit() {
    return hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }

  function loadPersonnel() {
    if (personnelLoaded || !etab) return;
    setLoadingPersonnel(true);
    api.getPersonnel()
      .then(p => {
        setPersonnel(p.filter((x: Personnel) => x.etablissementCentreId === etab.id));
        setPersonnelLoaded(true);
        setLoadingPersonnel(false);
      })
      .catch(() => setLoadingPersonnel(false));
  }

  function openTab(tab: Tab) {
    if (tab === 'personnel') loadPersonnel();
    setActiveTab(tab);
  }

  function uploadFile(event: React.ChangeEvent<HTMLInputElement>, fileType: string) {
    const file = event.target.files?.[0];
    if (!file || !etab) return;
    api.uploadEtablissementFile(etab.id, fileType, file)
      .then(e => {
        setEtab(e);
        setDocuments(buildDocs(e));
        showSuccess(t('ETABLISSEMENT.DETAIL.FILE_UPLOADED'));
      })
      .catch(() => showError(t('ETABLISSEMENT.DETAIL.UPLOAD_ERROR')));
  }

  function getFileUrl(path: string): string {
    return `http://localhost:8080/api/files?path=${path}`;
  }

  function formatType(type: string | undefined): string {
    return type ? t('ETABLISSEMENT.TYPES.' + type) : '-';
  }

  function formatEnum(val: string | undefined): string {
    if (!val) return '-';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatDate(date: string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!etab) return null;

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <div>
          <h1>{etab.nomFr}</h1>
          <div className="nomAr">{etab.nomAr}</div>
          <div className="meta-row">
            {etab.typeLocal && <span className="chip">{formatType(etab.typeLocal)}</span>}
            {etab.milieu && (
              <span className={`status-chip ${etab.milieu === 'URBAIN' ? 'active' : ''} ${etab.milieu === 'RURAL' ? 'pending' : ''}`}>
                {t('ETABLISSEMENT.MILIEUX.' + etab.milieu)}
              </span>
            )}
            <span className="text-secondary">{etab.provinceNom}</span>
            {etab.regionNom && <span className="text-secondary">— {etab.regionNom}</span>}
          </div>
        </div>
        <div className="header-actions">
          <Link href="/etablissements" className="btn btn-outline">
            <Icon name="arrow_back" /> {t('COMMON.BACK')}
          </Link>
          {canEdit() && (
            <Link href={`/etablissements/${etab.id}/edit`} className="btn btn-primary">
              <Icon name="edit" /> {t('COMMON.EDIT')}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => openTab('info')}>
          <Icon name="info" /> {t('ETABLISSEMENT.DETAIL.TAB_INFO')}
        </button>
        <button className={`tab ${activeTab === 'tech' ? 'active' : ''}`} onClick={() => openTab('tech')}>
          <Icon name="engineering" /> {t('ETABLISSEMENT.DETAIL.TAB_TECH')}
        </button>
        <button className={`tab ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => openTab('personnel')}>
          <Icon name="people" /> {t('PERSONNEL.TITLE')} ({personnelCount})
        </button>
        <button className={`tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => openTab('docs')}>
          <Icon name="folder" /> {t('ETABLISSEMENT.DETAIL.TAB_DOCS')}
        </button>
      </div>

      {/* Tab: Informations */}
      {activeTab === 'info' && (
        <div className="siipe-card tab-card">
          <div className="info-grid">
            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_IDENTIFICATION')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.CODE')}</span><strong>{etab.code || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.TELEPHONE')}</span><strong>{etab.telephone || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.FAX')}</span><strong>{etab.fax || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.ADRESSE')}</span><strong>{etab.adresse || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.UTILISATION')}</span><strong>{etab.utilisation || '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_CLASSIFICATION')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.MILIEU')}</span><strong>{etab.milieu ? t('ETABLISSEMENT.MILIEUX.' + etab.milieu) : '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.TYPE_LOCAL')}</span><strong>{formatType(etab.typeLocal)}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.PROPRIETE')}</span><strong>{etab.proprietecentre || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.GERE_PAR')}</span><strong>{etab.gererPar || '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_LOCALISATION')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.PROVINCE')}</span><strong>{etab.provinceNom || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.REGION')}</span><strong>{etab.regionNom || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.LATITUDE')}</span><strong>{etab.latitude ?? '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.LONGITUDE')}</span><strong>{etab.longitude ?? '-'}</strong></div>
            </div>

            {!!etab.programmes?.length && (
              <div className="info-section">
                <h3>{t('MENU.PROGRAMMES')}</h3>
                <div className="tags">
                  {etab.programmes.map(p => (
                    <span key={p.id} className="chip">{p.nomFr}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!!(etab.latitude && etab.longitude) && (
            <div className="map-preview">
              <h3>{t('ETABLISSEMENT.DETAIL.POSITION')}</h3>
              <a
                href={`https://maps.google.com/?q=${etab.latitude},${etab.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <Icon name="map" /> {t('ETABLISSEMENT.DETAIL.VIEW_ON_GOOGLE_MAPS')}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tab: Données techniques */}
      {activeTab === 'tech' && (
        <div className="siipe-card tab-card">
          <div className="info-grid">
            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_SUPERFICIE')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.SUPERFICIE_TERRAIN')}</span><strong>{etab.superficieTerrain ? etab.superficieTerrain + ' m²' : '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.SURFACE_BATIE')}</span><strong>{etab.surfaceBatie ? etab.surfaceBatie + ' m²' : '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.NOMBRE_ETAGES')}</span><strong>{etab.nombreEtage ?? '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.CAPACITE')}</span><strong>{etab.capaciteAccueil ?? '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_CONSTRUCTION')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.DATE_CONSTRUCTION')}</span><strong>{etab.dateConstruction || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.DATE_EXPLOITATION')}</span><strong>{etab.dateExploitation || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.ETAT')}</span><strong>{etab.etatConstruction || '-'}</strong></div>
            </div>

            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_LOYER')}</h3>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.NUMERO_TITRE')}</span><strong>{etab.numerotitre || '-'}</strong></div>
              <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.LOYER')}</span><strong>{t(etab.loyer ? 'COMMON.YES' : 'COMMON.NO')}</strong></div>
              {etab.loyer && (
                <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.MONTANT_LOYER')}</span><strong>{etab.montantLoyer ? etab.montantLoyer + ' MAD/mois' : '-'}</strong></div>
              )}
              {etab.loyer && (
                <div className="info-row"><span>{t('ETABLISSEMENT.DETAIL.PAYE_PAR')}</span><strong>{etab.paieLoyer || '-'}</strong></div>
              )}
            </div>

            <div className="info-section">
              <h3>{t('ETABLISSEMENT.DETAIL.SECTION_EQUIPEMENTS')}</h3>
              <div className="info-row">
                <span>{t('ETABLISSEMENT.DETAIL.EAU_POTABLE')}</span>
                <strong className={`bool-val ${etab.raccordementEauPotable ? 'yes' : ''}`}>
                  {etab.raccordementEauPotable ? '✓ ' : '✗ '}{t(etab.raccordementEauPotable ? 'COMMON.YES' : 'COMMON.NO')}
                </strong>
              </div>
              <div className="info-row">
                <span>{t('ETABLISSEMENT.DETAIL.ELECTRICITE')}</span>
                <strong className={`bool-val ${etab.raccordementElectricite ? 'yes' : ''}`}>
                  {etab.raccordementElectricite ? '✓ ' : '✗ '}{t(etab.raccordementElectricite ? 'COMMON.YES' : 'COMMON.NO')}
                </strong>
              </div>
              <div className="info-row">
                <span>{t('ETABLISSEMENT.DETAIL.AUTORISE')}</span>
                <strong className={`bool-val ${etab.autorise ? 'yes' : ''}`}>
                  {etab.autorise ? '✓ ' : '✗ '}{t(etab.autorise ? 'COMMON.YES' : 'COMMON.NO')}
                </strong>
              </div>
              {etab.autorise && (
                <div className="info-row">
                  <span>{t('ETABLISSEMENT.DETAIL.NUMERO_AUTORISATION')}</span>
                  <strong>{etab.numeroAutorisation || '-'}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Personnel */}
      {activeTab === 'personnel' && (
        <div className="siipe-card tab-card">
          {loadingPersonnel && (
            <div className="flex-center" style={{ height: 150 }}>
              <div className="spinner" />
            </div>
          )}
          {!loadingPersonnel && (
            <div>
              <div className="tab-header">
                <span className="text-secondary">{personnel.length} {t('ETABLISSEMENT.DETAIL.AGENTS_COUNT')}</span>
                {canEdit() && (
                  <Link href="/personnel/add" className="btn btn-primary btn-sm">
                    <Icon name="person_add" /> {t('COMMON.ADD')}
                  </Link>
                )}
              </div>
              {personnel.length > 0 && (
                <div className="table-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('PERSONNEL.NOM')}</th>
                        <th>{t('PERSONNEL.MATRICULE')}</th>
                        <th>{t('PERSONNEL.GRADE')}</th>
                        <th>{t('PERSONNEL.FONCTION')}</th>
                        <th>{t('COMMON.ACTIONS')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personnel.map(p => (
                        <tr key={p.id}>
                          <td>
                            <Link href={`/personnel/${p.id}`} className="link">{p.nom} {p.prenom}</Link>
                          </td>
                          <td>{p.matricule}</td>
                          <td>{formatEnum(p.grade)}</td>
                          <td>{formatEnum(p.fonction)}</td>
                          <td>
                            <Link href={`/personnel/${p.id}`} className="action-btn">
                              <Icon name="visibility" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {personnel.length === 0 && (
                <div className="empty-state">
                  <Icon name="people_outline" />
                  <p>{t('ETABLISSEMENT.DETAIL.NO_PERSONNEL')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'docs' && (
        <div className="siipe-card tab-card">
          <div className="docs-grid">
            {documents.map(doc => (
              <div key={doc.type} className="doc-item">
                <div className="doc-icon">
                  <Icon name="description" />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{t(doc.label)}</div>
                  {doc.url
                    ? <div><a href={getFileUrl(doc.url)} target="_blank" rel="noreferrer" className="doc-link">{t('ETABLISSEMENT.DETAIL.VIEW_FILE')}</a></div>
                    : <div className="text-secondary" style={{ fontSize: 12 }}>{t('ETABLISSEMENT.DETAIL.NOT_AVAILABLE')}</div>}
                </div>
                {canEdit() && (
                  <div className="doc-upload">
                    <label className="upload-btn">
                      <Icon name="upload" />
                      <input type="file" hidden onChange={e => uploadFile(e, doc.type)} />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit info */}
      <div className="audit-info">
        <span>{t('ETABLISSEMENT.DETAIL.CREATED_BY', { name: etab.createdBy, date: formatDate(etab.createdAt) })}</span>
        {etab.updatedAt && <span> — {t('ETABLISSEMENT.DETAIL.UPDATED_AT', { date: formatDate(etab.updatedAt) })}</span>}
      </div>

      <style jsx>{`
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .detail-header :global(h1) { font-size: 24px; color: var(--color-primary); margin-bottom: 4px; }
        .nomAr { font-size: 16px; color: var(--color-text-secondary); direction: rtl; margin-bottom: 8px; }
        .meta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .header-actions { display: flex; gap: 8px; }

        .btn-sm { padding: 6px 12px; font-size: var(--font-sm); }

        .tabs {
          display: flex; gap: 4px; margin-bottom: 16px;
          border-bottom: 2px solid var(--color-border); padding-bottom: 0;
        }
        .tab {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px; border: none; background: none;
          cursor: pointer; font-size: var(--font-base); color: var(--color-text-secondary);
          border-bottom: 3px solid transparent; margin-bottom: -2px;
          font-family: inherit; border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }
        .tab:hover { background: var(--color-surface-2); color: var(--color-primary); }
        .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
        .tab :global(.material-icons) { font-size: 18px; width: 18px; height: 18px; }

        .tab-card { border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg); }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }
        .info-section :global(h3) {
          color: var(--color-primary); font-size: 14px; font-weight: 600;
          border-bottom: 1px solid var(--color-primary-surface); padding-bottom: 8px; margin-bottom: 12px;
        }
        .info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 0; border-bottom: 1px solid var(--color-border); font-size: 14px;
        }
        .info-row span { color: var(--color-text-secondary); }
        .info-row strong { color: var(--color-text); text-align: end; }
        .bool-val { color: var(--color-danger); }
        .bool-val.yes { color: var(--color-primary-dark); }

        .tags { display: flex; flex-wrap: wrap; gap: 8px; }

        .tab-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 16px;
        }

        /* .link/.action-btn target next/link's <Link> (a custom component) —
           styled-jsx only auto-scopes native tags, so these must be :global()
           or the Link instances silently get unstyled. */
        :global(.link) { color: var(--color-primary); text-decoration: none; font-weight: 500; }
        :global(.link:hover) { text-decoration: underline; }
        :global(.action-btn) {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border: none; border-radius: var(--radius-sm);
          background: transparent; cursor: pointer; color: var(--color-text-secondary); text-decoration: none;
        }
        :global(.action-btn:hover) { background: var(--color-surface-2); }
        :global(.action-btn .material-icons) { font-size: 18px; width: 18px; height: 18px; }

        .empty-state {
          text-align: center; padding: 40px; color: var(--color-text-tertiary);
        }
        .empty-state :global(.material-icons) { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }

        .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .doc-item {
          display: flex; align-items: center; gap: 12px;
          padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
        }
        .doc-icon { color: var(--color-primary); }
        .doc-icon :global(.material-icons) { font-size: 32px; width: 32px; height: 32px; }
        .doc-name { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
        .doc-link { color: var(--color-primary); font-size: 13px; text-decoration: none; }
        .doc-link:hover { text-decoration: underline; }
        .doc-upload { margin-inline-start: auto; }
        .upload-btn {
          display: flex; align-items: center; cursor: pointer;
          color: var(--color-text-secondary); padding: 6px; border-radius: var(--radius-sm);
        }
        .upload-btn:hover { background: var(--color-surface-2); color: var(--color-primary); }

        .map-preview { margin-top: 24px; }
        .map-preview :global(h3) { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }

        .audit-info {
          margin-top: 16px; font-size: 12px; color: var(--color-text-tertiary);
          text-align: end; padding-bottom: 32px;
        }
      `}</style>
    </div>
  );
}
