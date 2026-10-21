'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { GRADES, FONCTIONS, NIVEAUX_SCOLAIRES, DIPLOMES } from '@/lib/models/personnel.model';
import type { Personnel } from '@/lib/models/personnel.model';
import type { EtablissementCentre, Programme, Prestation } from '@/lib/models/etablissement.model';

interface PersonnelFormState {
  nom: string;
  prenom: string;
  cin: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  situationFamille: string;
  nombreEnfant: string;
  email: string;
  telephone: string;
  matricule: string;
  numCouvertureSociale: string;
  situationAdministratif: string;
  dateRecrutement: string;
  grade: string;
  fonction: string;
  posteOccupe: string;
  categorie: string;
  salaire: string;
  niveauScolaire: string;
  diplome: string;
  etablissementCentreId: string;
  programmeId: string;
  prestationId: string;
  roleDescription: string;
  organisation: number | null;
  activite: number | null;
  specialisation: number | null;
  initiative: number | null;
  autonomie: number | null;
  adaptationProfessionnelle: number | null;
  relationsTravail: number | null;
  techniqueExecution: number | null;
  communication: number | null;
  toleranceStress: number | null;
  assiduitePointage: number | null;
  servicePopulation: number | null;
}

const EMPTY_FORM: PersonnelFormState = {
  nom: '',
  prenom: '',
  cin: '',
  sexe: '',
  dateNaissance: '',
  lieuNaissance: '',
  situationFamille: '',
  nombreEnfant: '',
  email: '',
  telephone: '',
  matricule: '',
  numCouvertureSociale: '',
  situationAdministratif: '',
  dateRecrutement: '',
  grade: '',
  fonction: '',
  posteOccupe: '',
  categorie: '',
  salaire: '',
  niveauScolaire: '',
  diplome: '',
  etablissementCentreId: '',
  programmeId: '',
  prestationId: '',
  roleDescription: '',
  organisation: null,
  activite: null,
  specialisation: null,
  initiative: null,
  autonomie: null,
  adaptationProfessionnelle: null,
  relationsTravail: null,
  techniqueExecution: null,
  communication: null,
  toleranceStress: null,
  assiduitePointage: null,
  servicePopulation: null
};

function toDateInputValue(date?: string): string {
  if (!date) return '';
  return date.slice(0, 10);
}

function personnelToForm(p: Personnel): PersonnelFormState {
  return {
    nom: p.nom || '',
    prenom: p.prenom || '',
    cin: p.cin || '',
    sexe: p.sexe || '',
    dateNaissance: toDateInputValue(p.dateNaissance),
    lieuNaissance: p.lieuNaissance || '',
    situationFamille: p.situationFamille || '',
    nombreEnfant: p.nombreEnfant != null ? String(p.nombreEnfant) : '',
    email: p.email || '',
    telephone: p.telephone || '',
    matricule: p.matricule || '',
    numCouvertureSociale: p.numCouvertureSociale || '',
    situationAdministratif: p.situationAdministratif || '',
    dateRecrutement: toDateInputValue(p.dateRecrutement),
    grade: p.grade || '',
    fonction: p.fonction || '',
    posteOccupe: p.posteOccupe || '',
    categorie: p.categorie || '',
    salaire: p.salaire != null ? String(p.salaire) : '',
    niveauScolaire: p.niveauScolaire || '',
    diplome: p.diplome || '',
    etablissementCentreId: p.etablissementCentreId != null ? String(p.etablissementCentreId) : '',
    programmeId: p.programmeId != null ? String(p.programmeId) : '',
    prestationId: p.prestationId != null ? String(p.prestationId) : '',
    roleDescription: p.roleDescription || '',
    organisation: p.organisation ?? null,
    activite: p.activite ?? null,
    specialisation: p.specialisation ?? null,
    initiative: p.initiative ?? null,
    autonomie: p.autonomie ?? null,
    adaptationProfessionnelle: p.adaptationProfessionnelle ?? null,
    relationsTravail: p.relationsTravail ?? null,
    techniqueExecution: p.techniqueExecution ?? null,
    communication: p.communication ?? null,
    toleranceStress: p.toleranceStress ?? null,
    assiduitePointage: p.assiduitePointage ?? null,
    servicePopulation: p.servicePopulation ?? null
  };
}

export function PersonnelForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<PersonnelFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [etablissements, setEtablissements] = useState<EtablissementCentre[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getEtablissements().then(setEtablissements).catch(() => {});
    api.getProgrammes().then(setProgrammes).catch(() => {});

    if (id) {
      setLoading(true);
      api.getPersonnelById(Number(id))
        .then(p => {
          setForm(personnelToForm(p));
          if (p.programmeId) {
            api.getPrestationsByProgramme(p.programmeId)
              .then(setPrestations)
              .catch(() => {});
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          router.push('/personnel');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setField<K extends keyof PersonnelFormState>(key: K, value: PersonnelFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function markTouched(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function onProgrammeChange(value: string) {
    setField('programmeId', value);
    if (!value) {
      setPrestations([]);
      return;
    }
    api.getPrestationsByProgramme(Number(value))
      .then(setPrestations)
      .catch(() => {});
  }

  const nomInvalid = !form.nom.trim();
  const prenomInvalid = !form.prenom.trim();
  const matriculeInvalid = !form.matricule.trim();
  const etabInvalid = !form.etablissementCentreId;
  const formInvalid = nomInvalid || prenomInvalid || matriculeInvalid || etabInvalid;

  const showErr = (field: string, invalid: boolean) => (touched[field] || submitted) && invalid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (formInvalid) return;
    setSaving(true);

    const data: any = {
      ...form,
      nombreEnfant: form.nombreEnfant !== '' ? Number(form.nombreEnfant) : null,
      salaire: form.salaire !== '' ? Number(form.salaire) : null,
      etablissementCentreId: form.etablissementCentreId !== '' ? Number(form.etablissementCentreId) : null,
      programmeId: form.programmeId !== '' ? Number(form.programmeId) : null,
      prestationId: form.prestationId !== '' ? Number(form.prestationId) : null
    };

    try {
      if (isEdit) {
        await api.updatePersonnel(Number(id), data);
        showSuccess(t('PERSONNEL.FORM.UPDATED'));
      } else {
        await api.createPersonnel(data);
        showSuccess(t('PERSONNEL.FORM.CREATED'));
      }
      router.push('/personnel');
    } catch {
      setSaving(false);
      showError(t('COMMON.ERROR'));
    }
  }

  return (
    <div className="personnel-form">
      <div className="page-header">
        <h1>{t(isEdit ? 'PERSONNEL.FORM.TITLE_EDIT' : 'PERSONNEL.FORM.TITLE_ADD')}</h1>
        <Link className="btn btn-outline" href="/personnel">
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
          {/* Section 1: Identité */}
          <div className="siipe-card mb-2">
            <h2 className="section-title">{t('PERSONNEL.FORM.SECTION_IDENTITE')}</h2>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.NOM')} *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setField('nom', e.target.value)}
                  onBlur={() => markTouched('nom')}
                  placeholder={t('PERSONNEL.FORM.NOM_PLACEHOLDER')}
                />
                {showErr('nom', nomInvalid) && <span className="err">{t('PERSONNEL.FORM.REQUIRED_FIELD')}</span>}
              </div>
              <div className="field">
                <label>{t('PERSONNEL.PRENOM')} *</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setField('prenom', e.target.value)}
                  onBlur={() => markTouched('prenom')}
                  placeholder={t('PERSONNEL.PRENOM')}
                />
                {showErr('prenom', prenomInvalid) && <span className="err">{t('PERSONNEL.FORM.REQUIRED_FIELD')}</span>}
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.CIN')}</label>
                <input type="text" value={form.cin} onChange={e => setField('cin', e.target.value)} placeholder="AA000000" />
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.SEXE')}</label>
                <select value={form.sexe} onChange={e => setField('sexe', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="MASCULIN">{t('PERSONNEL.FORM.SEXES.MASCULIN')}</option>
                  <option value="FEMININ">{t('PERSONNEL.FORM.SEXES.FEMININ')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.FORM.DATE_NAISSANCE')}</label>
                <input type="date" value={form.dateNaissance} onChange={e => setField('dateNaissance', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.LIEU_NAISSANCE')}</label>
                <input
                  type="text"
                  value={form.lieuNaissance}
                  onChange={e => setField('lieuNaissance', e.target.value)}
                  placeholder={t('PERSONNEL.FORM.VILLE_PLACEHOLDER')}
                />
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.SITUATION_FAMILLE')}</label>
                <select value={form.situationFamille} onChange={e => setField('situationFamille', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="CELIBATAIRE">{t('PERSONNEL.FORM.SITUATIONS_FAMILLE.CELIBATAIRE')}</option>
                  <option value="MARIE">{t('PERSONNEL.FORM.SITUATIONS_FAMILLE.MARIE')}</option>
                  <option value="DIVORCE">{t('PERSONNEL.FORM.SITUATIONS_FAMILLE.DIVORCE')}</option>
                  <option value="VEUF">{t('PERSONNEL.FORM.SITUATIONS_FAMILLE.VEUF')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.NOMBRE_ENFANTS')}</label>
                <input type="number" value={form.nombreEnfant} onChange={e => setField('nombreEnfant', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.FORM.EMAIL')}</label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@entraide.ma" />
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.TELEPHONE')}</label>
                <input type="text" value={form.telephone} onChange={e => setField('telephone', e.target.value)} placeholder="0600000000" />
              </div>
            </div>
          </div>

          {/* Section 2: Informations professionnelles */}
          <div className="siipe-card mb-2">
            <h2 className="section-title">{t('PERSONNEL.FORM.SECTION_INFOS_PRO')}</h2>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.MATRICULE')} *</label>
                <input
                  type="text"
                  value={form.matricule}
                  onChange={e => setField('matricule', e.target.value)}
                  onBlur={() => markTouched('matricule')}
                  placeholder="P0000"
                />
                {showErr('matricule', matriculeInvalid) && <span className="err">{t('PERSONNEL.FORM.REQUIRED_FIELD')}</span>}
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.NUM_COUVERTURE_SOCIALE')}</label>
                <input
                  type="text"
                  value={form.numCouvertureSociale}
                  onChange={e => setField('numCouvertureSociale', e.target.value)}
                  placeholder={t('PERSONNEL.FORM.NUMERO_PLACEHOLDER')}
                />
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.SITUATION_ADMINISTRATIVE')}</label>
                <select value={form.situationAdministratif} onChange={e => setField('situationAdministratif', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="EN">{t('PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.EN')}</option>
                  <option value="DETACHEMENT">{t('PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.DETACHEMENT')}</option>
                  <option value="MIS_DISPOSITION">{t('PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.MIS_DISPOSITION')}</option>
                  <option value="CONTRAT">{t('PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.CONTRAT')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.DATE_RECRUTEMENT')}</label>
                <input type="date" value={form.dateRecrutement} onChange={e => setField('dateRecrutement', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.GRADE')}</label>
                <select value={form.grade} onChange={e => setField('grade', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>{t(`PERSONNEL.FORM.GRADES.${g}`)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FONCTION')}</label>
                <select value={form.fonction} onChange={e => setField('fonction', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {FONCTIONS.map(f => (
                    <option key={f} value={f}>{t(`PERSONNEL.FORM.FONCTIONS.${f}`)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.POSTE_OCCUPE')}</label>
                <select value={form.posteOccupe} onChange={e => setField('posteOccupe', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="DIRECTEUR">{t('PERSONNEL.FORM.POSTES.DIRECTEUR')}</option>
                  <option value="DIRECTEUR_DU_CENTRE">{t('PERSONNEL.FORM.POSTES.DIRECTEUR_DU_CENTRE')}</option>
                  <option value="DIRECTEUR_PROVINCIAL">{t('PERSONNEL.FORM.POSTES.DIRECTEUR_PROVINCIAL')}</option>
                  <option value="DIRECTEUR_REGIONAL">{t('PERSONNEL.FORM.POSTES.DIRECTEUR_REGIONAL')}</option>
                  <option value="SOUS_DIRECTEUR">{t('PERSONNEL.FORM.POSTES.SOUS_DIRECTEUR')}</option>
                  <option value="CHEF_DE_DIVISION">{t('PERSONNEL.FORM.POSTES.CHEF_DE_DIVISION')}</option>
                  <option value="CHEF_DU_SERVICE">{t('PERSONNEL.FORM.POSTES.CHEF_DU_SERVICE')}</option>
                  <option value="INSPECTEUR">{t('PERSONNEL.FORM.POSTES.INSPECTEUR')}</option>
                  <option value="CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE">{t('PERSONNEL.FORM.POSTES.CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.CATEGORIE')}</label>
                <select value={form.categorie} onChange={e => setField('categorie', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="agent administratif">{t('PERSONNEL.FORM.CATEGORIES.AGENT_ADMINISTRATIF')}</option>
                  <option value="cadre">{t('PERSONNEL.FORM.CATEGORIES.CADRE')}</option>
                  <option value="technicien">{t('PERSONNEL.FORM.CATEGORIES.TECHNICIEN')}</option>
                  <option value="ouvrier">{t('PERSONNEL.FORM.CATEGORIES.OUVRIER')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.FORM.SALAIRE')}</label>
                <input type="number" value={form.salaire} onChange={e => setField('salaire', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Section 3: Formation */}
          <div className="siipe-card mb-2">
            <h2 className="section-title">{t('PERSONNEL.FORM.SECTION_FORMATION')}</h2>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.FORM.NIVEAU_SCOLAIRE')}</label>
                <select value={form.niveauScolaire} onChange={e => setField('niveauScolaire', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {NIVEAUX_SCOLAIRES.map(n => (
                    <option key={n} value={n}>{t(`PERSONNEL.FORM.NIVEAUX_SCOLAIRE.${n}`)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.DIPLOME')}</label>
                <select value={form.diplome} onChange={e => setField('diplome', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {DIPLOMES.map(d => (
                    <option key={d} value={d}>{t(`PERSONNEL.FORM.DIPLOMES.${d}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Affectation */}
          <div className="siipe-card mb-2">
            <h2 className="section-title">{t('PERSONNEL.FORM.SECTION_AFFECTATION')}</h2>
            <div className="form-row">
              <div className="field">
                <label>{t('PERSONNEL.FORM.ETABLISSEMENT_CENTRE')} *</label>
                <select
                  value={form.etablissementCentreId}
                  onChange={e => setField('etablissementCentreId', e.target.value)}
                  onBlur={() => markTouched('etablissementCentreId')}
                >
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {etablissements.map(e => (
                    <option key={e.id} value={e.id}>{e.nomFr}</option>
                  ))}
                </select>
                {showErr('etablissementCentreId', etabInvalid) && <span className="err">{t('PERSONNEL.FORM.REQUIRED_FIELD')}</span>}
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.PROGRAMME')}</label>
                <select value={form.programmeId} onChange={e => onProgrammeChange(e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('PERSONNEL.FORM.PRESTATION')}</label>
                <select value={form.prestationId} onChange={e => setField('prestationId', e.target.value)}>
                  <option value="">{t('PERSONNEL.FORM.SELECT_PLACEHOLDER')}</option>
                  {prestations.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Link className="btn btn-outline" href="/personnel">{t('COMMON.CANCEL')}</Link>
            <button className="btn btn-primary" type="submit" disabled={formInvalid || saving}>
              {saving ? <span className="spinner small" /> : <span>{t(isEdit ? 'COMMON.SAVE' : 'PERSONNEL.FORM.CREATE')}</span>}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .section-title {
          font-size: var(--font-md);
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--space-4);
        }
        .field input:focus, .field select:focus {
          box-shadow: 0 0 0 2px var(--color-primary-surface);
        }
        .err { color: var(--color-danger); font-size: 12px; }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 32px;
        }
        .spinner.small { width: 18px; height: 18px; border-width: 2px; border-color: rgba(255,255,255,0.4); border-top-color: white; }
      `}</style>
    </div>
  );
}
