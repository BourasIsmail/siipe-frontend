export interface EtablissementCentre {
  id: number;
  nomFr: string;
  nomAr: string;
  code?: string;
  telephone?: string;
  fax?: string;
  adresse?: string;
  milieu?: 'URBAIN' | 'RURAL';
  typeLocal?: string;
  proprietecentre?: string;
  gererPar?: string;
  personneResponsableCentre?: string;
  latitude?: number;
  longitude?: number;
  dateConstruction?: string;
  dateExploitation?: string;
  dateAchat?: string;
  superficieTerrain?: number;
  surfaceBatie?: number;
  superficieTotaleEtages?: number;
  nombreEtage?: number;
  etagesUtilises?: string;
  composant?: string;
  capaciteAccueil?: number;
  etatConstruction?: string;
  observation?: string;
  numerotitre?: string;
  loyer?: boolean;
  montantLoyer?: number;
  paieLoyer?: string;
  raccordementEauPotable?: boolean;
  raccordementElectricite?: boolean;
  planSituation?: boolean;
  planArchitecture?: boolean;
  litige?: boolean;
  raisonsConflit?: string;
  prixBatiment?: number;
  autorise?: boolean;
  numeroAutorisation?: string;
  utilisation?: string;
  provinceId?: number;
  provinceNom?: string;
  regionId?: number;
  regionNom?: string;
  photoUrl?: string;
  mappeCadastraleUrl?: string;
  certificatProprieteUrl?: string;
  planSituationUrl?: string;
  planArchitectureUrl?: string;
  programmes?: Programme[];
  prestationIds?: number[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Programme {
  id: number;
  nomFr: string;
  nomAr: string;
  description?: string;
  prestations?: Prestation[];
}

export interface Prestation {
  id: number;
  nomFr: string;
  nomAr: string;
  description?: string;
  programmeId: number;
  programmeNom?: string;
}

export interface Partenaire {
  id: number;
  nomFr: string;
  nomAr: string;
  type?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  responsable?: string;
  description?: string;
  logoUrl?: string;
  provinceId?: number;
  provinceNom?: string;
  regionId?: number;
  regionNom?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface Subvention {
  id: number;
  titre: string;
  description?: string;
  montant: number;
  dateDebut?: string;
  dateFin?: string;
  statut?: 'EN_COURS' | 'TERMINEE' | 'SUSPENDUE' | 'ANNULEE';
  conventionUrl?: string;
  partenaireId?: number;
  partenaireNom?: string;
  etablissementId?: number;
  etablissementNom?: string;
  programmeId?: number;
  programmeNom?: string;
  createdAt?: string;
  createdBy?: string;
}
