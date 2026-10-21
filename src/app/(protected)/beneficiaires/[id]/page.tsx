'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, downloadBlob } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type {
  Beneficiaire, SituationMedicale, SituationSociale, SituationJudiciaire,
  DossierScolaire, Accompagnement, BesoinExprime, PrestationBeneficiaire
} from '@/lib/models/beneficiaire.model';
import { SITUATION_COLOR_CLASS } from '@/lib/models/beneficiaire.model';
import type { Programme, Prestation, EtablissementCentre } from '@/lib/models/etablissement.model';

const AVATAR_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#00838f'];
const API_FILES_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://grh.entraide.ma/api';

function getFileUrl(path: string): string {
  return `${API_FILES_BASE}/files?path=${path}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const datePart = value.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR');
}

type TabKey = 'inscription' | 'famille' | 'besoin' | 'prestations' | 'sociale' | 'medicale' | 'judiciaire' | 'dossier' | 'contact';

export default function BeneficiaireDetailPage() {
  const params = useParams<{ id: string }>();
  const beneficiaireId = Number(params.id);
  const { canManageBeneficiaires } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();
  const canEdit = canManageBeneficiaires();

  const [beneficiaire, setBeneficiaire] = useState<Beneficiaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('inscription');
  const [addingForm, setAddingForm] = useState('');

  const [situationsMedicales, setSituationsMedicales] = useState<SituationMedicale[]>([]);
  const [situationsSociales, setSituationsSociales] = useState<SituationSociale[]>([]);
  const [situationsJudiciaires, setSituationsJudiciaires] = useState<SituationJudiciaire[]>([]);
  const [dossiers, setDossiers] = useState<DossierScolaire[]>([]);
  const [accompagnements, setAccompagnements] = useState<Accompagnement[]>([]);
  const [besoins, setBesoins] = useState<BesoinExprime[]>([]);
  const [prestationsBeneficiaire, setPrestationsBeneficiaire] = useState<PrestationBeneficiaire[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [prestationsBesoin, setPrestationsBesoin] = useState<Prestation[]>([]);
  const [prestationsPrestation, setPrestationsPrestation] = useState<Prestation[]>([]);
  const loadedTabs = useRef<Set<string>>(new Set());

  const [familleForm, setFamilleForm] = useState<Record<string, any>>({});
  const [medicaleForm, setMedicaleForm] = useState<Record<string, any>>({});
  const [socialeForm, setSocialeForm] = useState<Record<string, any>>({});
  const [judiciaireForm, setJudiciaireForm] = useState<Record<string, any>>({});
  const [dossierForm, setDossierForm] = useState<Record<string, any>>({});
  const [contactForm, setContactForm] = useState<Record<string, any>>({});
  const [besoinForm, setBesoinForm] = useState<Record<string, any>>({});
  const [prestationForm, setPrestationForm] = useState<Record<string, any>>({});

  const certificatFileRef = useRef<HTMLInputElement>(null);
  const judiciaireFileRef = useRef<HTMLInputElement>(null);
  const dossierFileRef = useRef<HTMLInputElement>(null);
  const prestationFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!beneficiaireId) return;
    api.getBeneficiaire(beneficiaireId)
      .then(b => {
        setBeneficiaire(b);
        setFamilleForm({
          situationProfessionnelle: b.situationProfessionnelle || '',
          sourceRevenu: b.sourceRevenu || '',
          couvertureSociale: b.couvertureSociale || '',
          revenuMensuel: b.revenuMensuel || '',
          typeHabitat: '',
          nombreFreres: null
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
    api.getProgrammes().then(setProgrammes).catch(() => {});
    api.getEtablissements().then(setEtablissements).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaireId]);

  const avatarColor = beneficiaire ? AVATAR_COLORS[beneficiaire.nom.charCodeAt(0) % AVATAR_COLORS.length] : AVATAR_COLORS[0];

  function formatEnum(val?: string): string {
    if (!val) return '-';
    return t('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + val);
  }

  function loadTab(tab: TabKey) {
    setActiveTab(tab);
    setAddingForm('');
    if (loadedTabs.current.has(tab) || !beneficiaire) return;
    setLoadingTab(true);
    const id = beneficiaire.id;
    const done = () => { setLoadingTab(false); loadedTabs.current.add(tab); };

    switch (tab) {
      case 'medicale': api.getSituationsMedicales(id).then(setSituationsMedicales).catch(() => {}).finally(done); break;
      case 'sociale': api.getSituationsSociales(id).then(setSituationsSociales).catch(() => {}).finally(done); break;
      case 'judiciaire': api.getSituationsJudiciaires(id).then(setSituationsJudiciaires).catch(() => {}).finally(done); break;
      case 'dossier': api.getDossiersScolaires(id).then(setDossiers).catch(() => {}).finally(done); break;
      case 'contact': api.getAccompagnements(id).then(setAccompagnements).catch(() => {}).finally(done); break;
      case 'besoin': api.getBesoins(id).then(setBesoins).catch(() => {}).finally(done); break;
      case 'prestations': api.getPrestationsBeneficiaire(id).then(setPrestationsBeneficiaire).catch(() => {}).finally(done); break;
      default: setLoadingTab(false);
    }
  }

  function showAddForm(type: string) {
    setAddingForm(type);
    setMedicaleForm({});
    setSocialeForm({});
    setJudiciaireForm({});
    setDossierForm({});
    setContactForm({});
    setBesoinForm({});
    setPrestationForm({});
    setPrestationsBesoin([]);
    setPrestationsPrestation([]);
  }

  function onProgrammeChangeBesoin(e: React.ChangeEvent<HTMLSelectElement>) {
    const programmeId = e.target.value;
    setBesoinForm((f: Record<string, any>) => ({ ...f, programmeId }));
    if (!programmeId) { setPrestationsBesoin([]); return; }
    api.getPrestationsByProgramme(Number(programmeId)).then(p => setPrestationsBesoin([...p])).catch(() => {});
  }

  function onProgrammeChangePrestation(e: React.ChangeEvent<HTMLSelectElement>) {
    const programmeId = e.target.value;
    setPrestationForm((f: Record<string, any>) => ({ ...f, programmeId }));
    if (!programmeId) { setPrestationsPrestation([]); return; }
    api.getPrestationsByProgramme(Number(programmeId)).then(p => setPrestationsPrestation([...p])).catch(() => {});
  }

  function saveFamille(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiaire) return;
    api.updateBeneficiaire(beneficiaire.id, { ...beneficiaire, ...familleForm })
      .then(b => { setBeneficiaire(b); showSuccess(t('BENEFICIAIRE.DETAIL.SAVED')); })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveMedicale() {
    if (!beneficiaire) return;
    api.addSituationMedicale(beneficiaire.id, medicaleForm)
      .then(s => {
        setSituationsMedicales(prev => [s, ...prev]);
        const file = certificatFileRef.current?.files?.[0];
        if (file) {
          api.uploadCertificatMedical(beneficiaire.id, s.id!, file)
            .then(updated => setSituationsMedicales(prev => prev.map(x => x.id === updated.id ? updated : x)))
            .catch(() => {});
        }
        setAddingForm('');
        setMedicaleForm({});
        if (certificatFileRef.current) certificatFileRef.current.value = '';
        showSuccess(t('BENEFICIAIRE.DETAIL.SAVED'));
      })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveSociale() {
    if (!beneficiaire) return;
    api.addSituationSociale(beneficiaire.id, socialeForm)
      .then(s => { setSituationsSociales(prev => [s, ...prev]); setAddingForm(''); setSocialeForm({}); showSuccess(t('BENEFICIAIRE.DETAIL.SAVED')); })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveJudiciaire() {
    if (!beneficiaire) return;
    api.addSituationJudiciaire(beneficiaire.id, judiciaireForm)
      .then(s => {
        setSituationsJudiciaires(prev => [s, ...prev]);
        const file = judiciaireFileRef.current?.files?.[0];
        if (file) {
          api.uploadPieceJointeJudiciaire(beneficiaire.id, s.id!, file)
            .then(updated => setSituationsJudiciaires(prev => prev.map(x => x.id === updated.id ? updated : x)))
            .catch(() => {});
        }
        setAddingForm('');
        setJudiciaireForm({});
        if (judiciaireFileRef.current) judiciaireFileRef.current.value = '';
        showSuccess(t('BENEFICIAIRE.DETAIL.SAVED'));
      })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveDossier() {
    if (!beneficiaire) return;
    api.addDossierScolaire(beneficiaire.id, dossierForm)
      .then(d => {
        setDossiers(prev => [d, ...prev]);
        const file = dossierFileRef.current?.files?.[0];
        if (file) {
          api.uploadPieceJointeDossier(beneficiaire.id, d.id!, file)
            .then(updated => setDossiers(prev => prev.map(x => x.id === updated.id ? updated : x)))
            .catch(() => {});
        }
        setAddingForm('');
        setDossierForm({});
        if (dossierFileRef.current) dossierFileRef.current.value = '';
        showSuccess(t('BENEFICIAIRE.DETAIL.SAVED'));
      })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveContact() {
    if (!beneficiaire) return;
    api.addAccompagnement(beneficiaire.id, contactForm)
      .then(a => { setAccompagnements(prev => [a, ...prev]); setAddingForm(''); setContactForm({}); showSuccess(t('BENEFICIAIRE.DETAIL.SAVED')); })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function saveBesoin() {
    if (!beneficiaire) return;
    api.addBesoin(beneficiaire.id, besoinForm)
      .then(b => { setBesoins(prev => [b, ...prev]); setAddingForm(''); setBesoinForm({}); setPrestationsBesoin([]); showSuccess(t('BENEFICIAIRE.DETAIL.SAVED')); })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function savePrestation() {
    if (!beneficiaire) return;
    api.addPrestationBeneficiaire(beneficiaire.id, prestationForm)
      .then(p => {
        setPrestationsBeneficiaire(prev => [p, ...prev]);
        const file = prestationFileRef.current?.files?.[0];
        if (file) {
          api.uploadPieceJointePrestation(beneficiaire.id, p.id!, file)
            .then(updated => setPrestationsBeneficiaire(prev => prev.map(x => x.id === updated.id ? updated : x)))
            .catch(() => {});
        }
        setAddingForm('');
        setPrestationForm({});
        setPrestationsPrestation([]);
        if (prestationFileRef.current) prestationFileRef.current.value = '';
        showSuccess(t('BENEFICIAIRE.DETAIL.SAVED'));
      })
      .catch(() => showError(t('COMMON.ERROR')));
  }

  function uploadCertificatMedical(e: React.ChangeEvent<HTMLInputElement>, situationId: number) {
    const file = e.target.files?.[0];
    if (!file || !beneficiaire) return;
    api.uploadCertificatMedical(beneficiaire.id, situationId, file)
      .then(s => { setSituationsMedicales(prev => prev.map(x => x.id === s.id ? s : x)); showSuccess(t('BENEFICIAIRE.DETAIL.UPLOADED_CERTIFICAT')); })
      .catch(() => showError(t('BENEFICIAIRE.DETAIL.ERROR_UPLOAD')));
  }

  function uploadPieceJointeJudiciaire(e: React.ChangeEvent<HTMLInputElement>, situationId: number) {
    const file = e.target.files?.[0];
    if (!file || !beneficiaire) return;
    api.uploadPieceJointeJudiciaire(beneficiaire.id, situationId, file)
      .then(s => { setSituationsJudiciaires(prev => prev.map(x => x.id === s.id ? s : x)); showSuccess(t('BENEFICIAIRE.DETAIL.UPLOADED')); })
      .catch(() => showError(t('BENEFICIAIRE.DETAIL.ERROR_UPLOAD')));
  }

  function uploadPieceJointeDossier(e: React.ChangeEvent<HTMLInputElement>, dossierId: number) {
    const file = e.target.files?.[0];
    if (!file || !beneficiaire) return;
    api.uploadPieceJointeDossier(beneficiaire.id, dossierId, file)
      .then(d => { setDossiers(prev => prev.map(x => x.id === d.id ? d : x)); showSuccess(t('BENEFICIAIRE.DETAIL.UPLOADED')); })
      .catch(() => showError(t('BENEFICIAIRE.DETAIL.ERROR_UPLOAD')));
  }

  function uploadPieceJointePrestation(e: React.ChangeEvent<HTMLInputElement>, prestationId: number) {
    const file = e.target.files?.[0];
    if (!file || !beneficiaire) return;
    api.uploadPieceJointePrestation(beneficiaire.id, prestationId, file)
      .then(p => { setPrestationsBeneficiaire(prev => prev.map(x => x.id === p.id ? p : x)); showSuccess(t('BENEFICIAIRE.DETAIL.UPLOADED')); })
      .catch(() => showError(t('BENEFICIAIRE.DETAIL.ERROR_UPLOAD')));
  }

  const exportFiche = useCallback(() => {
    if (!beneficiaire) return;
    api.exportBeneficiaireFiche(beneficiaire.id)
      .then(blob => downloadBlob(blob, `fiche-${beneficiaire.nom}.pdf`))
      .catch(err => showError(err instanceof ApiError ? err.message : t('COMMON.ERROR')));
  }, [beneficiaire, showError, t]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!beneficiaire) return null;

  const sexeLabel = beneficiaire.sexe === 'MASCULIN' ? t('BENEFICIAIRE.MASCULIN') : beneficiaire.sexe === 'FEMININ' ? t('BENEFICIAIRE.FEMININ') : '';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'inscription', label: t('MENU.INSCRIPTION') },
    { key: 'famille', label: t('BENEFICIAIRE.DETAIL.TAB_FAMILLE') },
    { key: 'besoin', label: t('BENEFICIAIRE.DETAIL.TAB_BESOIN') },
    { key: 'prestations', label: t('BENEFICIAIRE.DETAIL.TAB_PRESTATIONS') },
    { key: 'sociale', label: t('BENEFICIAIRE.TAB_SOCIALE') },
    { key: 'medicale', label: t('BENEFICIAIRE.TAB_MEDICAL') },
    { key: 'judiciaire', label: t('BENEFICIAIRE.TAB_JUDICIAIRE') },
    { key: 'dossier', label: t('BENEFICIAIRE.DETAIL.TAB_DOSSIER') },
    { key: 'contact', label: t('BENEFICIAIRE.DETAIL.TAB_CONTACT') }
  ];

  return (
    <div className="beneficiaire-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <div className="avatar avatar-large" style={{ background: avatarColor }}>
            {beneficiaire.nom.charAt(0)}{(beneficiaire.prenom || '').charAt(0)}
          </div>
          <div>
            <h1>{beneficiaire.nom} {beneficiaire.prenom}</h1>
            {beneficiaire.nomAr && <div className="nomAr">{beneficiaire.nomAr} {beneficiaire.prenomAr}</div>}
            <div className="meta-row">
              {beneficiaire.situationDifficulte && (
                <span className={`badge-situation ${beneficiaire.situationDifficulte ? SITUATION_COLOR_CLASS[beneficiaire.situationDifficulte] || '' : ''}`}>{formatEnum(beneficiaire.situationDifficulte)}</span>
              )}
              {beneficiaire.numeroDossier && (
                <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.NUMERO_PREFIX')} {beneficiaire.numeroDossier}</span>
              )}
              <span className="text-secondary">{sexeLabel}</span>
            </div>
            <div className="meta-row mt-1">
              <Icon name="business" style={{ fontSize: 16, width: 16, height: 16, color: '#888' }} />
              <span className="text-secondary">{beneficiaire.etablissementCentreNom || '-'}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/beneficiaires" className="btn btn-outline">
            <Icon name="arrow_back" /> {t('COMMON.BACK')}
          </Link>
          <button className="btn btn-outline" onClick={exportFiche}>
            <Icon name="print" /> {t('BENEFICIAIRE.DETAIL.PDF')}
          </button>
          {canEdit && (
            <Link href={`/beneficiaires/${beneficiaire.id}/edit`} className="btn btn-primary">
              <Icon name="edit" /> {t('COMMON.EDIT')}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tabDef => (
          <button
            key={tabDef.key}
            className={`tab ${activeTab === tabDef.key ? 'active' : ''}`}
            onClick={() => tabDef.key === 'inscription' || tabDef.key === 'famille' ? setActiveTab(tabDef.key) : loadTab(tabDef.key)}
          >
            {tabDef.label}
          </button>
        ))}
      </div>

      {/* Tab: Inscription */}
      {activeTab === 'inscription' && (
        <div className="siipe-card tab-card">
          <div className="info-grid">
            <div className="info-section">
              <h3>{t('BENEFICIAIRE.DETAIL.SECTION_IDENTIFICATION')}</h3>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.NOM_COMPLET')}</span><strong>{beneficiaire.nom} {beneficiaire.prenom}</strong></div>
              {beneficiaire.nomAr && (
                <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.NOM_ARABE')}</span><strong dir="rtl">{beneficiaire.nomAr} {beneficiaire.prenomAr}</strong></div>
              )}
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.NUMERO_DOSSIER')}</span><strong>{beneficiaire.numeroDossier || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.ALIAS')}</span><strong>{beneficiaire.alias || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.SEXE')}</span><strong>{sexeLabel || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DATE_NAISSANCE')}</span><strong>{formatDate(beneficiaire.dateNaissance)}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.TYPE_PIECE_IDENTITE')}</span><strong>{beneficiaire.typePieceIdentite || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.NUMERO_PIECE_IDENTITE')}</span><strong>{beneficiaire.cin || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.NATIONALITE')}</span><strong>{beneficiaire.nationalite || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.ADRESSE')}</span><strong>{beneficiaire.adresse || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.TELEPHONE')}</span><strong>{beneficiaire.telephone || '-'}</strong></div>
            </div>
            <div className="info-section">
              <h3>{t('BENEFICIAIRE.DETAIL.SECTION_PRISE_EN_CHARGE')}</h3>
              <div className="info-row"><span>{t('BENEFICIAIRE.ETABLISSEMENT')}</span><strong>{beneficiaire.etablissementCentreNom || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.PROGRAMME')}</span><strong>{beneficiaire.programmeNom || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.PRESTATION')}</span><strong>{beneficiaire.prestationNom || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.DATE_ACCUEIL')}</span><strong>{formatDate(beneficiaire.dateEntree)}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.DATE_SORTIE')}</span><strong>{formatDate(beneficiaire.dateSortie)}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.MOTIF_SORTIE')}</span><strong>{beneficiaire.motifSortie || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.VISITES_A_DOMICILE')}</span><strong>{t(beneficiaire.visitesADomicile ? 'COMMON.YES' : 'COMMON.NO')}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.SITUATION')}</span><strong>{formatEnum(beneficiaire.situationDifficulte)}</strong></div>
            </div>
            <div className="info-section">
              <h3>{t('BENEFICIAIRE.DETAIL.SECTION_SITUATION_PERSONNELLE')}</h3>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.SITUATION_SCOLAIRE_LABEL')}</span><strong>{beneficiaire.situationScolaire || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE')}</span><strong>{beneficiaire.situationFamiliale || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.TEMOIGNAGE_FAMILLE')}</span><strong>{beneficiaire.temoignageFamille || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.ETAT_SANTE_PSYCHIQUE_LABEL')}</span><strong>{beneficiaire.etatSantePsychique || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL')}</span><strong>{beneficiaire.situationProfessionnelle || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.SOURCE_REVENU')}</span><strong>{beneficiaire.sourceRevenu || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL')}</span><strong>{beneficiaire.couvertureSociale || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL')}</span><strong>{beneficiaire.revenuMensuel || '-'}</strong></div>
              <div className="info-row"><span>{t('BENEFICIAIRE.DETAIL.ETAT_COMPORTEMENT_LABEL')}</span><strong>{beneficiaire.etatComportement || '-'}</strong></div>
            </div>
          </div>
          {(beneficiaire.descriptionPhysique || beneficiaire.description) && (
            <div className="mt-2">
              {beneficiaire.descriptionPhysique && (
                <div className="obs-text"><strong>{t('BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE')}:</strong> {beneficiaire.descriptionPhysique}</div>
              )}
              {beneficiaire.description && (
                <div className="obs-text mt-1"><strong>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}:</strong> {beneficiaire.description}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Famille */}
      {activeTab === 'famille' && (
        <div className="siipe-card tab-card">
          <form onSubmit={saveFamille}>
            <div className="form-row">
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL')}</label>
                <select value={familleForm.situationProfessionnelle || ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, situationProfessionnelle: e.target.value }))}>
                  <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                  <option value="Élève">{t('BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ELEVE')}</option>
                  <option value="Étudiant">{t('BENEFICIAIRE.DETAIL.SITUATION_PRO_ETUDIANT')}</option>
                  <option value="Sans emploi">{t('BENEFICIAIRE.DETAIL.SITUATION_PRO_SANS_EMPLOI')}</option>
                  <option value="Employé">{t('BENEFICIAIRE.DETAIL.SITUATION_PRO_EMPLOYE')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.SOURCE_REVENU')}</label>
                <input type="text" value={familleForm.sourceRevenu || ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, sourceRevenu: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.SOURCE_REVENU')} />
              </div>
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL')}</label>
                <select value={familleForm.couvertureSociale || ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, couvertureSociale: e.target.value }))}>
                  <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                  <option value="Ramed">{t('BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.RAMED')}</option>
                  <option value="CNSS">{t('BENEFICIAIRE.DETAIL.COUVERTURE_CNSS')}</option>
                  <option value="CNOPS">{t('BENEFICIAIRE.DETAIL.COUVERTURE_CNOPS')}</option>
                  <option value="Aucune">{t('BENEFICIAIRE.DETAIL.COUVERTURE_AUCUNE')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL')}</label>
                <select value={familleForm.revenuMensuel || ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, revenuMensuel: e.target.value }))}>
                  <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                  <option value="Moins de 500">{t('BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.MOINS_500')}</option>
                  <option value="500 - 1000">{t('BENEFICIAIRE.DETAIL.REVENU_500_1000')}</option>
                  <option value="1000 - 2000">{t('BENEFICIAIRE.DETAIL.REVENU_1000_2000')}</option>
                  <option value="Plus de 2000">{t('BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.PLUS_2000')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.TYPE_HABITAT')}</label>
                <input type="text" value={familleForm.typeHabitat || ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, typeHabitat: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.TYPE_HABITAT_PLACEHOLDER')} />
              </div>
              <div className="field">
                <label>{t('BENEFICIAIRE.DETAIL.NOMBRE_FRERES')}</label>
                <input type="number" value={familleForm.nombreFreres ?? ''} onChange={e => setFamilleForm((f: Record<string, any>) => ({ ...f, nombreFreres: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>
            <div className="form-btns">
              <button type="submit" className="btn btn-primary">
                <Icon name="save" /> {t('COMMON.SAVE')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Besoin exprimé */}
      {activeTab === 'besoin' && (
        <div className="siipe-card tab-card">
          {addingForm === 'besoin' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVEAU_BESOIN')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.LIBELLE')}</label>
                  <input type="text" value={besoinForm.libelle || ''} onChange={e => setBesoinForm((f: Record<string, any>) => ({ ...f, libelle: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.LIBELLE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PROGRAMME')}</label>
                  <select value={besoinForm.programmeId || ''} onChange={onProgrammeChangeBesoin}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PRESTATION')}</label>
                  <select value={besoinForm.prestationId || ''} onChange={e => setBesoinForm((f: Record<string, any>) => ({ ...f, prestationId: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {prestationsBesoin.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
              </div>
              <div className="field mb-2">
                <label>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}</label>
                <textarea rows={3} value={besoinForm.description || ''} onChange={e => setBesoinForm((f: Record<string, any>) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveBesoin}>{t('COMMON.ADD')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.BESOIN_COUNT', { count: besoins.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('besoin')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && besoins.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.DETAIL.LIBELLE')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PROGRAMME')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PRESTATION')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}</th>
                  </tr>
                </thead>
                <tbody>
                  {besoins.map((b, i) => (
                    <tr key={b.id ?? i}>
                      <td>{b.libelle || '-'}</td>
                      <td>{b.programmeNom || '-'}</td>
                      <td>{b.prestationNom || '-'}</td>
                      <td>{b.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && besoins.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_BESOIN')}</div>}
        </div>
      )}

      {/* Tab: Mes prestations */}
      {activeTab === 'prestations' && (
        <div className="siipe-card tab-card">
          {addingForm === 'prestation' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVELLE_PRESTATION')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.ETABLISSEMENT')} *</label>
                  <select value={prestationForm.etablissementId || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, etablissementId: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {etablissements.map(et => <option key={et.id} value={et.id}>{et.nomFr}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PROGRAMME')} *</label>
                  <select value={prestationForm.programmeId || ''} onChange={onProgrammeChangePrestation}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PRESTATION')} *</label>
                  <select value={prestationForm.prestationId || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, prestationId: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {prestationsPrestation.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.ORIENTATION')}</label>
                  <select value={prestationForm.orientation || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, orientation: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Service interne">{t('BENEFICIAIRE.DETAIL.SERVICE_INTERNE')}</option>
                    <option value="Service externe">{t('BENEFICIAIRE.DETAIL.SERVICE_EXTERNE')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SERVICE_INTERNE')}</label>
                  <input type="text" value={prestationForm.serviceInterne || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, serviceInterne: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.SERVICE_PLACEHOLDER')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_DEBUT')}</label>
                  <input type="date" value={prestationForm.dateDebut || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, dateDebut: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.STATUT_PRESTATION')}</label>
                  <input type="text" value={prestationForm.statutPrestation || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, statutPrestation: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.STATUT')} />
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>{t('BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE')}</label>
                  <textarea rows={2} value={prestationForm.descriptionPhysique || ''} onChange={e => setPrestationForm((f: Record<string, any>) => ({ ...f, descriptionPhysique: e.target.value }))} />
                </div>
              </div>
              <div className="field mb-2">
                <label>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</label>
                <input type="file" ref={prestationFileRef} style={{ padding: 6 }} />
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={savePrestation}>{t('COMMON.ADD')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.PRESTATION_COUNT', { count: prestationsBeneficiaire.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('prestation')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && prestationsBeneficiaire.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.ETABLISSEMENT')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PROGRAMME')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PRESTATION')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.ORIENTATION')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DATE_DEBUT')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.STATUT')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prestationsBeneficiaire.map((p, i) => (
                    <tr key={p.id ?? i}>
                      <td>{p.etablissementNom || '-'}</td>
                      <td>{p.programmeNom || '-'}</td>
                      <td>{p.prestationNom || '-'}</td>
                      <td>{p.orientation || '-'}</td>
                      <td>{formatDate(p.dateDebut)}</td>
                      <td>{p.statutPrestation || '-'}</td>
                      <td>
                        {p.pieceJointeUrl && (
                          <a href={getFileUrl(p.pieceJointeUrl)} target="_blank" rel="noopener noreferrer" className="action-btn" title={t('COMMON.VIEW')}>
                            <Icon name="description" />
                          </a>
                        )}
                        {canEdit && (
                          <label className="action-btn" title={t('BENEFICIAIRE.DETAIL.UPLOAD')}>
                            <Icon name="upload" />
                            <input type="file" hidden onChange={e => uploadPieceJointePrestation(e, p.id!)} />
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && prestationsBeneficiaire.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_PRESTATION')}</div>}
        </div>
      )}

      {/* Tab: Situation sociale */}
      {activeTab === 'sociale' && (
        <div className="siipe-card tab-card">
          {addingForm === 'sociale' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_SOCIALE')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.SITUATION')}</label>
                  <select value={socialeForm.situationDifficulte || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, situationDifficulte: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Victime de violence">{t('DICT.VICTIME_DE_VIOLENCE')}</option>
                    <option value="Abandon">{t('BENEFICIAIRE.DETAIL.ABANDON')}</option>
                    <option value="Négligence">{t('BENEFICIAIRE.DETAIL.NEGLIGENCE')}</option>
                    <option value="Exploitation">{t('BENEFICIAIRE.DETAIL.EXPLOITATION')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.TYPE_VIOLENCE')}</label>
                  <input type="text" value={socialeForm.typeViolence || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, typeViolence: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.TYPE_LABEL')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DEGRE')}</label>
                  <input type="text" value={socialeForm.degre || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, degre: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.DEGRE')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SOURCE_VIOLENCE')}</label>
                  <input type="text" value={socialeForm.sourceViolence || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, sourceViolence: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.SOURCE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.LIEU_VIOLENCE')}</label>
                  <input type="text" value={socialeForm.lieuViolence || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, lieuViolence: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.LIEU')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_VIOLENCE')}</label>
                  <input type="date" value={socialeForm.dateViolence || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, dateViolence: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.VIOLENCE_REPETEE')}</label>
                  <input type="text" value={socialeForm.violenceRepetee || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, violenceRepetee: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.OUI_NON_PLACEHOLDER')} />
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>{t('BENEFICIAIRE.DETAIL.OBSERVATION')}</label>
                  <textarea rows={3} value={socialeForm.observation || ''} onChange={e => setSocialeForm((f: Record<string, any>) => ({ ...f, observation: e.target.value }))} />
                </div>
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveSociale}>{t('COMMON.ADD')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.REGISTRATION_COUNT', { count: situationsSociales.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('sociale')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && situationsSociales.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.DETAIL.SITUATION_LABEL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.TYPE_VIOLENCE_COL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.LIEU')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.OBSERVATION')}</th>
                  </tr>
                </thead>
                <tbody>
                  {situationsSociales.map((s, i) => (
                    <tr key={s.id ?? i}>
                      <td>{s.situationDifficulte || '-'}</td>
                      <td>{s.typeViolence || '-'}</td>
                      <td>{s.lieuViolence || '-'}</td>
                      <td>{formatDate(s.dateViolence)}</td>
                      <td>{s.observation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && situationsSociales.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_SOCIALE')}</div>}
        </div>
      )}

      {/* Tab: Situation Médicale */}
      {activeTab === 'medicale' && (
        <div className="siipe-card tab-card">
          {addingForm === 'medicale' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_MEDICALE')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.TAB_MEDICAL')}</label>
                  <select value={medicaleForm.situationMedicale || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, situationMedicale: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Physique">{t('DICT.PHYSIQUE')}</option>
                    <option value="Psychique">{t('DICT.PSYCHIQUE')}</option>
                    <option value="Chronique">{t('BENEFICIAIRE.DETAIL.SITUATION_MEDICALE_CHRONIQUE')}</option>
                    <option value="Handicap">{t('BENEFICIAIRE.DETAIL.SITUATION_MEDICALE_HANDICAP')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.HISTORIQUE_MEDICALE')}</label>
                  <input type="text" value={medicaleForm.historiqueMedicale || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, historiqueMedicale: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.HISTORIQUE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.MEDECIN')}</label>
                  <input type="text" value={medicaleForm.medecin || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, medecin: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.NOM_MEDECIN')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.UTILISATION_MEDICAMENT')}</label>
                  <select value={medicaleForm.utilisationMedicament || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, utilisationMedicament: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Oui">{t('COMMON.YES')}</option>
                    <option value="Non">{t('COMMON.NO')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</label>
                  <input type="date" value={medicaleForm.date || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.CERTIFICAT_FICHIER')}</label>
                  <input type="file" ref={certificatFileRef} style={{ padding: 6 }} />
                </div>
              </div>
              <div className="field mb-2">
                <label>{t('BENEFICIAIRE.DETAIL.OBSERVATION')}</label>
                <textarea rows={3} value={medicaleForm.observation || ''} onChange={e => setMedicaleForm((f: Record<string, any>) => ({ ...f, observation: e.target.value }))} />
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveMedicale}>{t('COMMON.SAVE')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.REGISTRATION_COUNT', { count: situationsMedicales.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('medicale')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && situationsMedicales.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.TAB_MEDICAL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.HISTORIQUE')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.MEDECIN')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.MEDICAMENT')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.CERTIFICAT')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.OBSERVATION')}</th>
                  </tr>
                </thead>
                <tbody>
                  {situationsMedicales.map((s, i) => (
                    <tr key={s.id ?? i}>
                      <td>{s.situationMedicale || '-'}</td>
                      <td>{s.historiqueMedicale || '-'}</td>
                      <td>{s.medecin || '-'}</td>
                      <td>{s.utilisationMedicament || '-'}</td>
                      <td>
                        {s.certificatUrl && (
                          <a href={getFileUrl(s.certificatUrl)} target="_blank" rel="noopener noreferrer" className="action-btn" title={t('COMMON.VIEW')}>
                            <Icon name="description" />
                          </a>
                        )}
                        {canEdit && (
                          <label className="action-btn" title={t('BENEFICIAIRE.DETAIL.UPLOAD')}>
                            <Icon name="upload" />
                            <input type="file" hidden onChange={e => uploadCertificatMedical(e, s.id!)} />
                          </label>
                        )}
                      </td>
                      <td>{s.observation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && situationsMedicales.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_MEDICALE')}</div>}
        </div>
      )}

      {/* Tab: Situation Judiciaire */}
      {activeTab === 'judiciaire' && (
        <div className="siipe-card tab-card">
          {addingForm === 'judiciaire' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_JUDICIAIRE')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PEINE')}</label>
                  <select value={judiciaireForm.peine || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, peine: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Peines criminelles">{t('BENEFICIAIRE.DETAIL.PEINES_CRIMINELLES')}</option>
                    <option value="Peines correctionnelles">{t('BENEFICIAIRE.DETAIL.PEINES_CORRECTIONNELLES')}</option>
                    <option value="Peines de police">{t('BENEFICIAIRE.DETAIL.PEINES_DE_POLICE')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PEINES_CRIMINELLES')}</label>
                  <select value={judiciaireForm.peinesCriminelles || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, peinesCriminelles: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Peine de mort">{t('DICT.PEINE_DE_MORT')}</option>
                    <option value="Réclusion criminelle">{t('BENEFICIAIRE.DETAIL.RECLUSION_CRIMINELLE')}</option>
                    <option value="Détention criminelle">{t('BENEFICIAIRE.DETAIL.DETENTION_CRIMINELLE')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DUREE_MOIS')}</label>
                  <input type="text" value={judiciaireForm.duree || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, duree: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.DUREE')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.LIEUX')}</label>
                  <input type="text" value={judiciaireForm.lieux || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, lieux: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.LIEU')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</label>
                  <input type="date" value={judiciaireForm.date || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</label>
                  <input type="file" ref={judiciaireFileRef} style={{ padding: 6 }} />
                </div>
              </div>
              <div className="field mb-2">
                <label>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}</label>
                <textarea rows={3} value={judiciaireForm.description || ''} onChange={e => setJudiciaireForm((f: Record<string, any>) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveJudiciaire}>{t('COMMON.ADD')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.REGISTRATION_COUNT', { count: situationsJudiciaires.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('judiciaire')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && situationsJudiciaires.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.DETAIL.LIEUX')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DUREE')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</th>
                  </tr>
                </thead>
                <tbody>
                  {situationsJudiciaires.map((s, i) => (
                    <tr key={s.id ?? i}>
                      <td>{s.lieux || '-'}</td>
                      <td>{formatDate(s.date)}</td>
                      <td>{s.duree || '-'}</td>
                      <td>{s.description || '-'}</td>
                      <td>
                        {s.pieceJointeUrl && (
                          <a href={getFileUrl(s.pieceJointeUrl)} target="_blank" rel="noopener noreferrer" className="action-btn">
                            <Icon name="description" />
                          </a>
                        )}
                        {canEdit && (
                          <label className="action-btn">
                            <Icon name="upload" />
                            <input type="file" hidden onChange={e => uploadPieceJointeJudiciaire(e, s.id!)} />
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && situationsJudiciaires.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_JUDICIAIRE')}</div>}
        </div>
      )}

      {/* Tab: Dossier */}
      {activeTab === 'dossier' && (
        <div className="siipe-card tab-card">
          {addingForm === 'dossier' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVEAU_DOSSIER')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.TYPE_LABEL')}</label>
                  <select value={dossierForm.type || ''} onChange={e => setDossierForm((f: Record<string, any>) => ({ ...f, type: e.target.value }))}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Médicale">{t('DICT.MEDICALE')}</option>
                    <option value="Scolaire">{t('DICT.SCOLAIRE')}</option>
                    <option value="Judiciaire">{t('BENEFICIAIRE.DETAIL.TYPE_JUDICIAIRE')}</option>
                    <option value="Social">{t('BENEFICIAIRE.DETAIL.TYPE_SOCIAL')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</label>
                  <input type="date" value={dossierForm.date || ''} onChange={e => setDossierForm((f: Record<string, any>) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</label>
                  <input type="file" ref={dossierFileRef} style={{ padding: 6 }} />
                </div>
              </div>
              <div className="field mb-2">
                <label>{t('BENEFICIAIRE.DETAIL.DECISIONS')}</label>
                <textarea rows={3} value={dossierForm.decisions || ''} onChange={e => setDossierForm((f: Record<string, any>) => ({ ...f, decisions: e.target.value }))} />
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveDossier}>{t('COMMON.ADD')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.DOSSIER_COUNT', { count: dossiers.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('dossier')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && dossiers.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.DETAIL.DATE_LABEL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.TYPE_LABEL')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.DECISIONS')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.PIECE_JOINTE')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d, i) => (
                    <tr key={d.id ?? i}>
                      <td>{formatDate(d.date)}</td>
                      <td>{d.type || '-'}</td>
                      <td>{d.decisions || '-'}</td>
                      <td>
                        {d.pieceJointeUrl && (
                          <a href={getFileUrl(d.pieceJointeUrl)} target="_blank" rel="noopener noreferrer" className="action-btn">
                            <Icon name="description" />
                          </a>
                        )}
                        {canEdit && (
                          <label className="action-btn">
                            <Icon name="upload" />
                            <input type="file" hidden onChange={e => uploadPieceJointeDossier(e, d.id!)} />
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && dossiers.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_DOSSIER')}</div>}
        </div>
      )}

      {/* Tab: Contact */}
      {activeTab === 'contact' && (
        <div className="siipe-card tab-card">
          {addingForm === 'contact' && (
            <div className="add-form">
              <h4>{t('BENEFICIAIRE.DETAIL.NOUVEAU_CONTACT')}</h4>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PRECISER_ACCOMPAGNEMENT')}</label>
                  <input type="text" value={contactForm.preciserAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, preciserAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.TYPE_LABEL')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.NOM')}</label>
                  <input type="text" value={contactForm.nomAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, nomAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.NOM')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.PRENOM')}</label>
                  <input type="text" value={contactForm.prenomAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, prenomAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.PRENOM')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.ADRESSE')}</label>
                  <input type="text" value={contactForm.adresseAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, adresseAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.ADRESSE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.TELEPHONE')}</label>
                  <input type="text" value={contactForm.telephoneAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, telephoneAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.TELEPHONE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.EMAIL')}</label>
                  <input type="email" value={contactForm.emailAccompagnement || ''} onChange={e => setContactForm((f: Record<string, any>) => ({ ...f, emailAccompagnement: e.target.value }))} placeholder={t('BENEFICIAIRE.DETAIL.EMAIL')} />
                </div>
              </div>
              <div className="form-btns">
                <button className="btn btn-outline" onClick={() => setAddingForm('')}>{t('COMMON.CANCEL')}</button>
                <button className="btn btn-primary" onClick={saveContact}>{t('COMMON.SAVE')}</button>
              </div>
            </div>
          )}

          <div className="tab-header">
            <span className="text-secondary">{t('BENEFICIAIRE.DETAIL.CONTACT_COUNT', { count: accompagnements.length })}</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => showAddForm('contact')}>
                <Icon name="add" /> {t('COMMON.ADD')}
              </button>
            )}
          </div>
          {loadingTab && <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>}
          {!loadingTab && accompagnements.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('BENEFICIAIRE.TAB_ACCOMPAGNEMENT')}</th>
                    <th>{t('BENEFICIAIRE.NOM')}</th>
                    <th>{t('BENEFICIAIRE.PRENOM')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.TELEPHONE')}</th>
                    <th>{t('BENEFICIAIRE.DETAIL.EMAIL')}</th>
                  </tr>
                </thead>
                <tbody>
                  {accompagnements.map((a, i) => (
                    <tr key={a.id ?? i}>
                      <td>{a.preciserAccompagnement || '-'}</td>
                      <td>{a.nomAccompagnement || '-'}</td>
                      <td>{a.prenomAccompagnement || '-'}</td>
                      <td>{a.telephoneAccompagnement || '-'}</td>
                      <td>{a.emailAccompagnement || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingTab && accompagnements.length === 0 && <div className="empty-tab">{t('BENEFICIAIRE.DETAIL.EMPTY_CONTACT')}</div>}
        </div>
      )}

      <div className="audit-info">
        <span>{t('BENEFICIAIRE.DETAIL.CREATED_BY', { name: beneficiaire.createdBy, date: formatDate(beneficiaire.createdAt) })}</span>
      </div>

      <style jsx>{`
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .avatar-large { width: 72px; height: 72px; font-size: 24px; }
        h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 4px; }
        .nomAr { font-size: 15px; color: var(--color-text-tertiary); direction: rtl; margin-bottom: 6px; }
        .meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .tabs { display: flex; gap: 2px; margin-bottom: 16px; border-bottom: 2px solid var(--color-border); overflow-x: auto; }
        .tab { padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; border-bottom: 3px solid transparent; margin-bottom: -2px; font-family: inherit; border-radius: 4px 4px 0 0; }
        .tab:hover { background: var(--color-surface-2); color: var(--color-primary); }
        .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
        .tab-card { border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg) !important; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        .info-section :global(h3) { color: var(--color-primary); font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--color-primary-surface); padding-bottom: 8px; margin-bottom: 12px; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--color-border); font-size: 14px; }
        .info-row span { color: var(--color-text-secondary); }
        .info-row strong { color: var(--color-text); text-align: end; max-width: 60%; }
        .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .add-form { background: var(--color-surface-2); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; border: 1px solid var(--color-border); }
        .add-form h4 { color: var(--color-primary); margin-bottom: 16px; font-size: 15px; }
        .form-btns { display: flex; justify-content: flex-end; gap: 8px; }
        .obs-text { font-size: 13px; color: var(--color-text-secondary); padding: 8px; background: var(--color-surface-2); border-radius: var(--radius-sm); }
        .action-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: none; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--color-primary); text-decoration: none; }
        .action-btn:hover { background: var(--color-primary-surface); }
        .action-btn :global(.material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .empty-tab { text-align: center; padding: 40px; color: var(--color-text-tertiary); font-size: 14px; }
        .audit-info { margin-top: 16px; font-size: 12px; color: var(--color-text-tertiary); text-align: end; padding-bottom: 32px; }
      `}</style>
    </div>
  );
}
