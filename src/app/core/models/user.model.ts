export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  active: boolean;
  regionId?: number;
  regionNom?: string;
  provinceId?: number;
  provinceNom?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  provinceId?: number;
  provinceNom?: string;
  regionId?: number;
  regionNom?: string;
}

export interface CreateUserRequest {
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  regionId?: number;
  provinceId?: number;
}

export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_DELEGUE'
  | 'ROLE_CHEF_SERVICE'
  | 'ROLE_CHEF_DIVISION'
  | 'ROLE_DIRECTEUR_CENTRALE'
  | 'ROLE_RESPONSABLE_ALERTE'
  | 'ROLE_RESPONSABLE_SIGNALEMENT'
  | 'ROLE_ASSISTANTE_SOCIALE';

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_ADMIN: 'Administrateur',
  ROLE_DELEGUE: 'Délégué régional',
  ROLE_CHEF_SERVICE: 'Chef de service',
  ROLE_CHEF_DIVISION: 'Chef de division',
  ROLE_DIRECTEUR_CENTRALE: 'Directeur central',
  ROLE_RESPONSABLE_ALERTE: 'Responsable des alertes',
  ROLE_RESPONSABLE_SIGNALEMENT: 'Responsable des signalements',
  ROLE_ASSISTANTE_SOCIALE: 'Assistante sociale'
};
