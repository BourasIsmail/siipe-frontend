export interface Personnel {
  id: number;
  nom: string;
  prenom: string;
  cin?: string;
  sexe?: 'MASCULIN' | 'FEMININ';
  matricule: string;
  numCouvertureSociale?: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  situationFamille?: string;
  nombreEnfant?: number;
  situationAdministratif?: string;
  dateRecrutement?: string;
  grade?: string;
  niveauScolaire?: string;
  diplome?: string;
  salaire?: number;
  categorie?: string;
  fonction?: string;
  posteOccupe?: string;
  roleDescription?: string;
  photoUrl?: string;
  etablissementCentreId?: number;
  etablissementCentreNom?: string;
  programmeId?: number;
  programmeNom?: string;
  prestationId?: number;
  prestationNom?: string;
  provinceId?: number;
  provinceNom?: string;
  organisation?: number;
  activite?: number;
  specialisation?: number;
  initiative?: number;
  autonomie?: number;
  adaptationProfessionnelle?: number;
  relationsTravail?: number;
  techniqueExecution?: number;
  communication?: number;
  toleranceStress?: number;
  assiduitePointage?: number;
  servicePopulation?: number;
  observation1?: string;
  observation2?: string;
  observation3?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FormationContinue {
  id: number;
  titre: string;
  description?: string;
  organisme?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  dureeJours?: number;
  attestationUrl?: string;
  etablissementCentreId?: number;
  etablissementCentreNom?: string;
  participants?: Personnel[];
  createdAt?: string;
  createdBy?: string;
}

export const GRADES = [
  'AGENT_CET_ENTRAIDE_NLE', 'REDACTEUR', 'SECRETAIRE_PRINCIPAL',
  'AGENT_EXECUTION_PRINCIPAL', 'AGENT_EXECUTION', 'AGENT_DE_SERVICE',
  'ADJOINT_TECHNIQUE_HORS_CATEGORIE', 'ADJOINT_TECHNIQUE_2EME_CATEGORIE',
  'TECHNICIEN_PREMIER_GRADE', 'TECHNICIEN_DEUXIEME_GRADE',
  'ADMINISTRATEUR_1ER_GRADE', 'ADMINISTRATEUR_2EME_GRADE',
  'REDACTEUR_1ER_GRADE', 'REDACTEUR_2EME_GRADE',
  'ADJOINT_ADMINISTRATIF_1ER_GRADE', 'INGENIEUR_EN_CHEF_PREMIER_GRADE',
  'ARCHITECTE_PREMIER_GRADE', 'AGENTS_A_CONTRAT'
];

export const FONCTIONS = [
  'DIRECTEUR', 'INSPECTEUR', 'SOUS_DIRECTEUR', 'CHEF_DE_DIVISION',
  'CHEF_DE_SERVICE', 'DIRECTEUR_REGIONAL', 'DIRECTEUR_PROVINCIAL',
  'DIRECTEUR_DU_CENTRE', 'RESPONSABLE_ADMINISTRATIF_FINANCIER',
  'AGENT_SURVEILLANCE_SECURITE', 'ASSISTANT_SOCIAL', 'MEDECIN',
  'INFIRMIER', 'PSYCHOLOGUE', 'EDUCATEUR', 'FORMATEUR',
  'CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE'
];

export const NIVEAUX_SCOLAIRES = [
  'PRESCOLAIRE_PRIMAIRE', 'COLLEGE', 'LYCEE',
  'FORMATION_PROFESSIONNELLE', 'ETUDES_SUPERIEURES'
];

export const DIPLOMES = [
  'BTS', 'DUT', 'BEP', 'DEUG', 'LICENCE', 'MASTER', 'DOCTORAT',
  'CSP', 'DQP', 'DSP', 'DT', 'DTS', 'CQP'
];
