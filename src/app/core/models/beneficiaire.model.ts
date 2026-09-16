export interface Beneficiaire {
  id: number;
  nom: string;
  prenom: string;
  nomAr?: string;
  prenomAr?: string;
  alias?: string;
  cin?: string;
  numActeNaissance?: string;
  numPasseport?: string;
  numeroDossier?: string;
  typePieceIdentite?: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  adresse?: string;
  telephone?: string;
  situationDifficulte?: string;
  dateEntree?: string;
  dateSortie?: string;
  motifSortie?: string;
  visitesADomicile?: boolean;
  situationScolaire?: string;
  situationFamiliale?: string;
  temoignageFamille?: string;
  descriptionPhysique?: string;
  etatSantePsychique?: string;
  situationProfessionnelle?: string;
  sourceRevenu?: string;
  couvertureSociale?: string;
  revenuMensuel?: string;
  etatComportement?: string;
  description?: string;
  nomPere?: string;
  nomMere?: string;
  nomTuteur?: string;
  telephoneParent?: string;
  adresseParent?: string;
  photoUrl?: string;
  etablissementCentreId?: number;
  etablissementCentreNom?: string;
  programmeId?: number;
  programmeNom?: string;
  prestationId?: number;
  prestationNom?: string;
  assistanteSocialeNom?: string;
  provinceId?: number;
  provinceNom?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SituationMedicale {
  id?: number;
  situationMedicale?: string;
  historiqueMedicale?: string;
  medecin?: string;
  utilisationMedicament?: string;
  date?: string;
  certificatUrl?: string;
  observation?: string;
}

export interface SituationSociale {
  id?: number;
  situationDifficulte?: string;
  typeViolence?: string;
  degre?: string;
  sourceViolence?: string;
  lieuViolence?: string;
  dateViolence?: string;
  violenceRepetee?: string;
  observation?: string;
}

export interface SituationJudiciaire {
  id?: number;
  peine?: string;
  peinesCriminelles?: string;
  duree?: string;
  lieux?: string;
  date?: string;
  pieceJointeUrl?: string;
  description?: string;
}

export interface DossierScolaire {
  id?: number;
  type?: string;
  date?: string;
  decisions?: string;
  pieceJointeUrl?: string;
}

export interface Accompagnement {
  id?: number;
  preciserAccompagnement?: string;
  nomAccompagnement?: string;
  prenomAccompagnement?: string;
  adresseAccompagnement?: string;
  telephoneAccompagnement?: string;
  emailAccompagnement?: string;
}

export interface BesoinExprime {
  id?: number;
  libelle?: string;
  programmeNom?: string;
  prestationNom?: string;
  description?: string;
}

export interface PrestationBeneficiaire {
  id?: number;
  etablissementNom?: string;
  programmeNom?: string;
  prestationNom?: string;
  orientation?: string;
  serviceInterne?: string;
  dateDebut?: string;
  statutPrestation?: string;
  descriptionPhysique?: string;
  pieceJointeUrl?: string;
}

export interface BeneficiaireSearchParams {
  nom?: string;
  prenom?: string;
  cin?: string;
  sexe?: string;
  situationDifficulte?: string;
  dateNaissanceFrom?: string;
  dateNaissanceTo?: string;
  dateEntreeFrom?: string;
  dateEntreeTo?: string;
  etablissementId?: number;
  provinceId?: number;
}

export const SITUATIONS_DIFFICULTE = [
  'ENFANT_EN_SITUATION_DE_RUE',
  'ENFANT_EN_SITUATION_DE_HANDICAP',
  'ENFANT_EN_CONFLIT_AVEC_LA_LOI',
  'ENFANT_VICTIME_DE_VIOLENCE',
  'ENFANT_ABANDONNE',
  'ENFANT_EN_SITUATION_DE_TRAVAIL',
  'FEMME_EN_SITUATION_DE_VIOLENCE',
  'PERSONNE_AGEE',
  'AUTRE'
];
