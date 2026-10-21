'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { SITUATIONS_DIFFICULTE } from '@/lib/models/beneficiaire.model';
import type { EtablissementCentre, Programme, Prestation } from '@/lib/models/etablissement.model';

interface FormState {
  nom: string;
  prenom: string;
  nomAr: string;
  prenomAr: string;
  alias: string;
  cin: string;
  numActeNaissance: string;
  numPasseport: string;
  numeroDossier: string;
  typePieceIdentite: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  telephone: string;
  visitesADomicile: string;
  situationScolaire: string;
  situationFamiliale: string;
  temoignageFamille: string;
  descriptionPhysique: string;
  etatSantePsychique: string;
  situationProfessionnelle: string;
  sourceRevenu: string;
  couvertureSociale: string;
  revenuMensuel: string;
  etatComportement: string;
  description: string;
  nomPere: string;
  nomMere: string;
  nomTuteur: string;
  telephoneParent: string;
  adresseParent: string;
  situationDifficulte: string;
  dateEntree: string;
  dateSortie: string;
  motifSortie: string;
  etablissementCentreId: string;
  programmeId: string;
  prestationId: string;
}

function initialForm(): FormState {
  return {
    nom: '', prenom: '', nomAr: '', prenomAr: '', alias: '', cin: '',
    numActeNaissance: '', numPasseport: '', numeroDossier: '', typePieceIdentite: '',
    sexe: '', dateNaissance: '', lieuNaissance: '', nationalite: 'Marocaine', adresse: '',
    telephone: '', visitesADomicile: '', situationScolaire: '', situationFamiliale: '',
    temoignageFamille: '', descriptionPhysique: '', etatSantePsychique: '',
    situationProfessionnelle: '', sourceRevenu: '', couvertureSociale: '', revenuMensuel: '',
    etatComportement: '', description: '', nomPere: '', nomMere: '', nomTuteur: '',
    telephoneParent: '', adresseParent: '', situationDifficulte: '', dateEntree: '',
    dateSortie: '', motifSortie: '', etablissementCentreId: '', programmeId: '', prestationId: ''
  };
}

function toDateInput(value: any): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toSelectString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

const SITUATION_SCOLAIRE_OPTIONS = [
  { value: 'Scolarisé', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.SCOLARISE' },
  { value: 'Déscolarisé', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.DESCOLARISE' },
  { value: 'Analphabète', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ANALPHABETE' },
  { value: 'Alphabétisation', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ALPHABETISATION' },
  { value: 'Ecole coranique', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ECOLE_CORANIQUE' },
  { value: 'Formation professionnelle', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.FORMATION_PROFESSIONNELLE' },
  { value: 'Non scolarisé', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.NON_SCOLARISE' },
  { value: 'Education non formelle', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.EDUCATION_NON_FORMELLE' },
  { value: 'En formation Professionnelle', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.EN_FORMATION_PROFESSIONNELLE' },
  { value: 'Décrochage scolaire', key: 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.DECROCHAGE_SCOLAIRE' }
];

const ETAT_SANTE_PSYCHIQUE_OPTIONS = [
  { value: 'Avec troubles psychique', key: 'BENEFICIAIRE.OPTIONS.ETAT_SANTE_PSYCHIQUE.AVEC_TROUBLES' },
  { value: 'Sans troubles psychique', key: 'BENEFICIAIRE.OPTIONS.ETAT_SANTE_PSYCHIQUE.SANS_TROUBLES' }
];

const SITUATION_PROFESSIONNELLE_OPTIONS = [
  { value: 'Élève', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ELEVE' },
  { value: 'Etudiant(e)', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ETUDIANT' },
  { value: 'Jeune femme au foyer', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.FEMME_AU_FOYER' },
  { value: 'Journalier(e)', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.JOURNALIER' },
  { value: 'Sans', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SANS' },
  { value: 'Salarié(e) dans le secteur privé', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SALARIE_PRIVE' },
  { value: 'Salarié(e) dans le secteur public', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SALARIE_PUBLIC' },
  { value: 'Retraité(e)', key: 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.RETRAITE' }
];

const COUVERTURE_SOCIALE_OPTIONS = [
  { value: 'Ramed', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.RAMED' },
  { value: 'Sans couverture', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.SANS_COUVERTURE' },
  { value: 'AMO CNSS', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.AMO_CNSS' },
  { value: 'AMO CNOPS', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.AMO_CNOPS' },
  { value: 'Assurance privée', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.ASSURANCE_PRIVEE' },
  { value: 'Mutuelle', key: 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.MUTUELLE' }
];

const REVENU_MENSUEL_OPTIONS = [
  { value: 'Moins de 500', key: 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.MOINS_500' },
  { value: '500 < revenu < 1000', key: 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_500_A_1000' },
  { value: '1000 < revenu < 1500', key: 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_1000_A_1500' },
  { value: '1500 < revenu < 2000', key: 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_1500_A_2000' },
  { value: 'Plus de 2000', key: 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.PLUS_2000' }
];

const ETAT_COMPORTEMENT_OPTIONS = [
  { value: 'Agitation motrice', key: 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.AGITATION_MOTRICE' },
  { value: "L'impulsivité", key: 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.IMPULSIVITE' },
  { value: "L'agressivité", key: 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.AGRESSIVITE' },
  { value: 'La désobéissance', key: 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.DESOBEISSANCE' },
  { value: "L'instabilité émotionnelle", key: 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.INSTABILITE_EMOTIONNELLE' }
];

export function BeneficiaireForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();
  const { hasRole, user } = useAuth();

  const [form, setForm] = useState<FormState>(initialForm());
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  function restrictToOwnEtablissement() {
    return hasRole('ROLE_ASSISTANTE_SOCIALE');
  }

  useEffect(() => {
    api.getEtablissements().then(e => {
      const ownId = user?.etablissementCentreId;
      setEtablissements(restrictToOwnEtablissement() ? e.filter((x: EtablissementCentre) => x.id === ownId) : [...e]);
    });
    api.getProgrammes().then(p => setProgrammes([...p]));

    if (!isEdit && restrictToOwnEtablissement()) {
      setForm(f => ({ ...f, etablissementCentreId: toSelectString(user?.etablissementCentreId ?? '') }));
    }

    if (id) {
      setLoading(true);
      api.getBeneficiaire(Number(id)).then(b => {
        setForm(f => ({
          ...f,
          ...Object.fromEntries(Object.entries(b).filter(([k]) => k in f)),
          dateNaissance: toDateInput(b.dateNaissance),
          dateEntree: toDateInput(b.dateEntree),
          dateSortie: toDateInput(b.dateSortie),
          etablissementCentreId: toSelectString(b.etablissementCentreId),
          programmeId: toSelectString(b.programmeId),
          prestationId: toSelectString(b.prestationId),
          visitesADomicile: typeof b.visitesADomicile === 'boolean' ? String(b.visitesADomicile) : toSelectString(b.visitesADomicile)
        }));
        if (b.programmeId) {
          api.getPrestationsByProgramme(b.programmeId).then(pr => setPrestations([...pr]));
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
        router.replace('/beneficiaires');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function markTouched(key: string) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  function onProgrammeChange(value: string) {
    set('programmeId', value);
    if (!value) { setPrestations([]); return; }
    api.getPrestationsByProgramme(Number(value)).then(p => setPrestations([...p]));
  }

  const required = {
    etablissementCentreId: !form.etablissementCentreId,
    nom: !form.nom,
    prenom: !form.prenom,
    nomAr: !form.nomAr,
    numeroDossier: !form.numeroDossier
  };
  const formInvalid = Object.values(required).some(Boolean);

  function showErr(key: keyof typeof required) {
    return (touched[key] || submitted) && required[key];
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (formInvalid) return;
    setSaving(true);
    try {
      const result = isEdit
        ? await api.updateBeneficiaire(Number(id), form)
        : await api.createBeneficiaire(form);
      showSuccess(t(isEdit ? 'BENEFICIAIRE.FORM.UPDATED' : 'BENEFICIAIRE.FORM.CREATED'));
      router.push(`/beneficiaires/${result.id}`);
    } catch (err) {
      setSaving(false);
      showError(err instanceof ApiError ? err.message : t('COMMON.ERROR'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t(isEdit ? 'BENEFICIAIRE.FORM.TITLE_EDIT' : 'BENEFICIAIRE.FORM.TITLE_ADD')}</h1>
        <Link href="/beneficiaires" className="btn btn-outline">
          <Icon name="arrow_back" /> {t('COMMON.BACK')}
        </Link>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <form onSubmit={onSubmit}>
          {/* Section 1: Inscription */}
          <div className="siipe-card mb-2">
            <div className="form-section">
              <h3>{t('MENU.INSCRIPTION')}</h3>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.VISITES_A_DOMICILE')}</label>
                  <select value={form.visitesADomicile} onChange={e => set('visitesADomicile', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="true">{t('COMMON.YES')}</option>
                    <option value="false">{t('COMMON.NO')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.ETABLISSEMENT')} *</label>
                  <select
                    value={form.etablissementCentreId}
                    onChange={e => set('etablissementCentreId', e.target.value)}
                    onBlur={() => markTouched('etablissementCentreId')}
                  >
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {etablissements.map(e => <option key={e.id} value={e.id}>{e.nomFr}</option>)}
                  </select>
                  {showErr('etablissementCentreId') && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PROGRAMME')}</label>
                  <select value={form.programmeId} onChange={e => onProgrammeChange(e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.NOM')} *</label>
                  <input
                    type="text" value={form.nom} onChange={e => set('nom', e.target.value)}
                    onBlur={() => markTouched('nom')}
                    placeholder={t('PERSONNEL.FORM.NOM_PLACEHOLDER')}
                  />
                  {showErr('nom') && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.PRENOM')} *</label>
                  <input
                    type="text" value={form.prenom} onChange={e => set('prenom', e.target.value)}
                    onBlur={() => markTouched('prenom')}
                    placeholder={t('BENEFICIAIRE.PRENOM')}
                  />
                  {showErr('prenom') && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.NOM_ARABE')} *</label>
                  <input
                    type="text" value={form.nomAr} onChange={e => set('nomAr', e.target.value)}
                    onBlur={() => markTouched('nomAr')}
                    dir="rtl" placeholder="الاسم"
                  />
                  {showErr('nomAr') && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.PRENOM_AR')}</label>
                  <input type="text" value={form.prenomAr} onChange={e => set('prenomAr', e.target.value)} dir="rtl" placeholder="النسب" />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.SEXE')}</label>
                  <select value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="MASCULIN">{t('BENEFICIAIRE.MASCULIN')}</option>
                    <option value="FEMININ">{t('BENEFICIAIRE.FEMININ')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_ACCUEIL')}</label>
                  <input type="date" value={form.dateEntree} onChange={e => set('dateEntree', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.NUMERO_DOSSIER')} *</label>
                  <input
                    type="text" value={form.numeroDossier} onChange={e => set('numeroDossier', e.target.value)}
                    onBlur={() => markTouched('numeroDossier')}
                    placeholder={t('BENEFICIAIRE.FORM.NUMERO_DOSSIER_PLACEHOLDER')}
                  />
                  {showErr('numeroDossier') && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.ALIAS')}</label>
                  <input type="text" value={form.alias} onChange={e => set('alias', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.ALIAS')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.NATIONALITE')}</label>
                  <input type="text" value={form.nationalite} onChange={e => set('nationalite', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.NATIONALITE_PLACEHOLDER')} />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DATE_NAISSANCE')}</label>
                  <input type="date" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.TYPE_PIECE_IDENTITE')}</label>
                  <select value={form.typePieceIdentite} onChange={e => set('typePieceIdentite', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    <option value="Sans">{t('DICT.SANS')}</option>
                    <option value="CIN">{t('DICT.CIN')}</option>
                    <option value="Passeport">{t('DICT.PASSEPORT')}</option>
                    <option value="Acte de naissance">{t('DICT.ACTE_DE_NAISSANCE')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.NUMERO_PIECE_IDENTITE')}</label>
                  <input type="text" value={form.cin} onChange={e => set('cin', e.target.value)} placeholder={t('PERSONNEL.FORM.NUMERO_PLACEHOLDER')} />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SITUATION_SCOLAIRE_LABEL')}</label>
                  <select value={form.situationScolaire} onChange={e => set('situationScolaire', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {SITUATION_SCOLAIRE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE')}</label>
                  <input type="text" value={form.situationFamiliale} onChange={e => set('situationFamiliale', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.TEMOIGNAGE_FAMILLE_LABEL')}</label>
                  <input type="text" value={form.temoignageFamille} onChange={e => set('temoignageFamille', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.TEMOIGNAGE_PLACEHOLDER')} />
                </div>
              </div>

              <div className="form-row">
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>{t('BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE')}</label>
                  <textarea rows={3} value={form.descriptionPhysique} onChange={e => set('descriptionPhysique', e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.ETAT_SANTE_PSYCHIQUE_LABEL')}</label>
                  <select value={form.etatSantePsychique} onChange={e => set('etatSantePsychique', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {ETAT_SANTE_PSYCHIQUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL')}</label>
                  <select value={form.situationProfessionnelle} onChange={e => set('situationProfessionnelle', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {SITUATION_PROFESSIONNELLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.SOURCE_REVENU')}</label>
                  <input type="text" value={form.sourceRevenu} onChange={e => set('sourceRevenu', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.SOURCE_REVENU')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL')}</label>
                  <select value={form.couvertureSociale} onChange={e => set('couvertureSociale', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {COUVERTURE_SOCIALE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL')}</label>
                  <select value={form.revenuMensuel} onChange={e => set('revenuMensuel', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {REVENU_MENSUEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.ETAT_COMPORTEMENT_LABEL')}</label>
                  <select value={form.etatComportement} onChange={e => set('etatComportement', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {ETAT_COMPORTEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.ADRESSE')}</label>
                  <input type="text" value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.ADRESSE')} />
                </div>
              </div>

              <div className="form-row">
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <label>{t('BENEFICIAIRE.DETAIL.DESCRIPTION')}</label>
                  <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Famille */}
          <div className="siipe-card mb-2">
            <div className="form-section">
              <h3>{t('BENEFICIAIRE.DETAIL.TAB_FAMILLE')}</h3>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.NOM_PERE_LABEL')}</label>
                  <input type="text" value={form.nomPere} onChange={e => set('nomPere', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.NOM_PERE_PLACEHOLDER')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.NOM_MERE_LABEL')}</label>
                  <input type="text" value={form.nomMere} onChange={e => set('nomMere', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.NOM_MERE_LABEL')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.NOM_TUTEUR_LABEL')}</label>
                  <input type="text" value={form.nomTuteur} onChange={e => set('nomTuteur', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.NOM_TUTEUR_LABEL')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.TELEPHONE_PARENT_LABEL')}</label>
                  <input type="text" value={form.telephoneParent} onChange={e => set('telephoneParent', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.TELEPHONE')} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.ADRESSE_PARENT_LABEL')}</label>
                  <input type="text" value={form.adresseParent} onChange={e => set('adresseParent', e.target.value)} placeholder={t('BENEFICIAIRE.DETAIL.ADRESSE')} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Situation de difficulté */}
          <div className="siipe-card mb-2">
            <div className="form-section">
              <h3>{t('BENEFICIAIRE.SITUATION')}</h3>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.SITUATION')}</label>
                  <select value={form.situationDifficulte} onChange={e => set('situationDifficulte', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {SITUATIONS_DIFFICULTE.map(s => (
                      <option key={s} value={s}>{t('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + s)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.DATE_SORTIE')}</label>
                  <input type="date" value={form.dateSortie} onChange={e => set('dateSortie', e.target.value)} />
                </div>
                <div className="field">
                  <label>{t('BENEFICIAIRE.FORM.MOTIF_SORTIE_LABEL')}</label>
                  <input type="text" value={form.motifSortie} onChange={e => set('motifSortie', e.target.value)} placeholder={t('BENEFICIAIRE.FORM.MOTIF_PLACEHOLDER')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('BENEFICIAIRE.DETAIL.PRESTATION')}</label>
                  <select value={form.prestationId} onChange={e => set('prestationId', e.target.value)}>
                    <option value="">{t('BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER')}</option>
                    {prestations.map(p => <option key={p.id} value={p.id}>{p.nomFr}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Link href="/beneficiaires" className="btn btn-outline">{t('COMMON.CANCEL')}</Link>
            <button type="submit" className="btn btn-primary" disabled={formInvalid || saving}>
              {saving ? <span className="spinner small" /> : <span>{t(isEdit ? 'COMMON.SAVE' : 'BENEFICIAIRE.FORM.SUBMIT_INSCRIRE')}</span>}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .err { color: var(--color-danger); font-size: 12px; }
        .form-actions {
          display: flex; justify-content: flex-end;
          gap: 12px; margin-top: 16px; margin-bottom: 32px;
        }
        .spinner.small { width: 18px; height: 18px; border-width: 2px; border-color: rgba(255,255,255,0.4); border-top-color: white; }
      `}</style>
    </div>
  );
}
