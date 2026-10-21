'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://grh.entraide.ma/api';
const TOKEN_KEY = 'siipe_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: any;
    isForm?: boolean;
    responseType?: 'json' | 'blob';
    params?: Record<string, any>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, isForm = false, responseType = 'json', params } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') qs.set(k, String(v));
    });
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('siipe_user');
      window.location.href = '/auth/login';
    }
    throw new ApiError(401, 'Session expirée ou non authentifiée');
  }

  if (!res.ok) {
    let errBody: any = null;
    try { errBody = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, errBody?.message || `Erreur ${res.status}`, errBody);
  }

  if (responseType === 'blob') return (await res.blob()) as unknown as T;
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function uploadForm(file: File): FormData {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

export const api = {
  // ---- AUTH ----
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: data }),
  forgotPassword: (email: string) =>
    request<any>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, newPassword: string) =>
    request<any>('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),

  // ---- GEO ----
  getRegions: () => request<any[]>('/geo/regions'),
  getProvinces: () => request<any[]>('/geo/provinces'),
  getProvincesByRegion: (regionId: number) => request<any[]>(`/geo/provinces/region/${regionId}`),

  // ---- USERS ----
  getUsers: () => request<any[]>('/admin/users'),
  createUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: data }),
  updateUser: (id: string, data: any) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  resendActivation: (id: string) => request<any>(`/admin/users/${id}/resend-activation`, { method: 'POST', body: {} }),

  // ---- ETABLISSEMENTS ----
  getEtablissements: () => request<any[]>('/etablissements'),
  getEtablissementsForMap: () => request<any[]>('/etablissements/map'),
  getEtablissement: (id: number) => request<any>(`/etablissements/${id}`),
  createEtablissement: (data: any) => request<any>('/etablissements', { method: 'POST', body: data }),
  updateEtablissement: (id: number, data: any) => request<any>(`/etablissements/${id}`, { method: 'PUT', body: data }),
  deleteEtablissement: (id: number) => request<void>(`/etablissements/${id}`, { method: 'DELETE' }),
  uploadEtablissementFile: (id: number, fileType: string, file: File) =>
    request<any>(`/etablissements/${id}/files/${fileType}`, { method: 'POST', body: uploadForm(file), isForm: true }),

  // ---- PROGRAMMES ----
  getProgrammes: () => request<any[]>('/programmes'),
  createProgramme: (data: any) => request<any>('/programmes', { method: 'POST', body: data }),
  updateProgramme: (id: number, data: any) => request<any>(`/programmes/${id}`, { method: 'PUT', body: data }),
  deleteProgramme: (id: number) => request<void>(`/programmes/${id}`, { method: 'DELETE' }),
  getPrestationsByProgramme: (programmeId: number) => request<any[]>(`/programmes/${programmeId}/prestations`),
  createPrestation: (programmeId: number, data: any) => request<any>(`/programmes/${programmeId}/prestations`, { method: 'POST', body: data }),
  deletePrestation: (id: number) => request<void>(`/programmes/prestations/${id}`, { method: 'DELETE' }),

  // ---- PARTENAIRES ----
  getPartenaires: () => request<any[]>('/partenaires'),
  createPartenaire: (data: any) => request<any>('/partenaires', { method: 'POST', body: data }),
  updatePartenaire: (id: number, data: any) => request<any>(`/partenaires/${id}`, { method: 'PUT', body: data }),
  deletePartenaire: (id: number) => request<void>(`/partenaires/${id}`, { method: 'DELETE' }),

  // ---- SUBVENTIONS ----
  getSubventions: () => request<any[]>('/subventions'),
  createSubvention: (data: any) => request<any>('/subventions', { method: 'POST', body: data }),
  updateSubvention: (id: number, data: any) => request<any>(`/subventions/${id}`, { method: 'PUT', body: data }),
  deleteSubvention: (id: number) => request<void>(`/subventions/${id}`, { method: 'DELETE' }),

  // ---- PERSONNEL ----
  getPersonnel: () => request<any[]>('/personnel'),
  getPersonnelById: (id: number) => request<any>(`/personnel/${id}`),
  createPersonnel: (data: any) => request<any>('/personnel', { method: 'POST', body: data }),
  updatePersonnel: (id: number, data: any) => request<any>(`/personnel/${id}`, { method: 'PUT', body: data }),
  deletePersonnel: (id: number) => request<void>(`/personnel/${id}`, { method: 'DELETE' }),
  uploadPersonnelPhoto: (id: number, file: File) =>
    request<any>(`/personnel/${id}/photo`, { method: 'POST', body: uploadForm(file), isForm: true }),

  // ---- FORMATIONS ----
  getFormations: () => request<any[]>('/formations'),
  createFormation: (data: any) => request<any>('/formations', { method: 'POST', body: data }),
  updateFormation: (id: number, data: any) => request<any>(`/formations/${id}`, { method: 'PUT', body: data }),
  deleteFormation: (id: number) => request<void>(`/formations/${id}`, { method: 'DELETE' }),
  uploadFormationAttestation: (id: number, file: File) =>
    request<any>(`/formations/${id}/attestation`, { method: 'POST', body: uploadForm(file), isForm: true }),

  // ---- BENEFICIAIRES ----
  getBeneficiaires: () => request<any[]>('/beneficiaires'),
  searchBeneficiaires: (params: Record<string, any>) => request<any[]>('/beneficiaires/search', { params }),
  getBeneficiaire: (id: number) => request<any>(`/beneficiaires/${id}`),
  createBeneficiaire: (data: any) => request<any>('/beneficiaires', { method: 'POST', body: data }),
  updateBeneficiaire: (id: number, data: any) => request<any>(`/beneficiaires/${id}`, { method: 'PUT', body: data }),
  deleteBeneficiaire: (id: number) => request<void>(`/beneficiaires/${id}`, { method: 'DELETE' }),
  uploadBeneficiairePhoto: (id: number, file: File) =>
    request<any>(`/beneficiaires/${id}/photo`, { method: 'POST', body: uploadForm(file), isForm: true }),

  getSituationsMedicales: (id: number) => request<any[]>(`/beneficiaires/${id}/situations-medicales`),
  addSituationMedicale: (id: number, data: any) => request<any>(`/beneficiaires/${id}/situations-medicales`, { method: 'POST', body: data }),
  getSituationsSociales: (id: number) => request<any[]>(`/beneficiaires/${id}/situations-sociales`),
  addSituationSociale: (id: number, data: any) => request<any>(`/beneficiaires/${id}/situations-sociales`, { method: 'POST', body: data }),
  getSituationsJudiciaires: (id: number) => request<any[]>(`/beneficiaires/${id}/situations-judiciaires`),
  addSituationJudiciaire: (id: number, data: any) => request<any>(`/beneficiaires/${id}/situations-judiciaires`, { method: 'POST', body: data }),
  getDossiersScolaires: (id: number) => request<any[]>(`/beneficiaires/${id}/dossiers-scolaires`),
  addDossierScolaire: (id: number, data: any) => request<any>(`/beneficiaires/${id}/dossiers-scolaires`, { method: 'POST', body: data }),
  getAccompagnements: (id: number) => request<any[]>(`/beneficiaires/${id}/accompagnements`),
  addAccompagnement: (id: number, data: any) => request<any>(`/beneficiaires/${id}/accompagnements`, { method: 'POST', body: data }),
  getBesoins: (id: number) => request<any[]>(`/beneficiaires/${id}/besoins`),
  addBesoin: (id: number, data: any) => request<any>(`/beneficiaires/${id}/besoins`, { method: 'POST', body: data }),
  getPrestationsBeneficiaire: (id: number) => request<any[]>(`/beneficiaires/${id}/prestations-beneficiaire`),
  addPrestationBeneficiaire: (id: number, data: any) => request<any>(`/beneficiaires/${id}/prestations-beneficiaire`, { method: 'POST', body: data }),

  uploadCertificatMedical: (beneficiaireId: number, situationId: number, file: File) =>
    request<any>(`/beneficiaires/${beneficiaireId}/situations-medicales/${situationId}/certificat`, { method: 'POST', body: uploadForm(file), isForm: true }),
  uploadPieceJointeJudiciaire: (beneficiaireId: number, situationId: number, file: File) =>
    request<any>(`/beneficiaires/${beneficiaireId}/situations-judiciaires/${situationId}/piece-jointe`, { method: 'POST', body: uploadForm(file), isForm: true }),
  uploadPieceJointeDossier: (beneficiaireId: number, dossierId: number, file: File) =>
    request<any>(`/beneficiaires/${beneficiaireId}/dossiers-scolaires/${dossierId}/piece-jointe`, { method: 'POST', body: uploadForm(file), isForm: true }),
  uploadPieceJointePrestation: (beneficiaireId: number, prestationId: number, file: File) =>
    request<any>(`/beneficiaires/${beneficiaireId}/prestations-beneficiaire/${prestationId}/piece-jointe`, { method: 'POST', body: uploadForm(file), isForm: true }),

  // ---- DASHBOARD ----
  getDashboard: () => request<any>('/dashboard'),

  // ---- EXPORT ----
  exportExcel: (type: string) => request<Blob>(`/export/excel/${type}`, { responseType: 'blob' }),
  exportPdf: (type: string) => request<Blob>(`/export/pdf/${type}`, { responseType: 'blob' }),
  exportBeneficiaireFiche: (id: number) => request<Blob>(`/export/pdf/beneficiaire/${id}`, { responseType: 'blob' })
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
