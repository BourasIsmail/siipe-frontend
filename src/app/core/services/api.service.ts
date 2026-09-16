import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateUserRequest } from '../models/user.model';
import { Region, Province } from '../models/geo.model';
import { EtablissementCentre, Programme, Prestation, Partenaire, Subvention } from '../models/etablissement.model';
import { Personnel, FormationContinue } from '../models/personnel.model';
import {
  Beneficiaire,
  SituationMedicale,
  SituationSociale,
  SituationJudiciaire,
  DossierScolaire,
  Accompagnement,
  BesoinExprime,
  BeneficiaireSearchParams,
  PrestationBeneficiaire
} from '../models/beneficiaire.model';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- GEO ----
  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.api}/geo/regions`);
  }
  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.api}/geo/provinces`);
  }
  getProvincesByRegion(regionId: number): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.api}/geo/provinces/region/${regionId}`);
  }

  // ---- USERS ----
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/admin/users`);
  }
  createUser(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.api}/admin/users`, data);
  }
  updateUser(id: string, data: CreateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.api}/admin/users/${id}`, data);
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/users/${id}`);
  }
  resendActivation(id: string): Observable<any> {
    return this.http.post(`${this.api}/admin/users/${id}/resend-activation`, {});
  }

  // ---- ETABLISSEMENTS ----
  getEtablissements(): Observable<EtablissementCentre[]> {
    return this.http.get<EtablissementCentre[]>(`${this.api}/etablissements`);
  }
  getEtablissementsForMap(): Observable<EtablissementCentre[]> {
    return this.http.get<EtablissementCentre[]>(`${this.api}/etablissements/map`);
  }
  getEtablissement(id: number): Observable<EtablissementCentre> {
    return this.http.get<EtablissementCentre>(`${this.api}/etablissements/${id}`);
  }
  createEtablissement(data: any): Observable<EtablissementCentre> {
    return this.http.post<EtablissementCentre>(`${this.api}/etablissements`, data);
  }
  updateEtablissement(id: number, data: any): Observable<EtablissementCentre> {
    return this.http.put<EtablissementCentre>(`${this.api}/etablissements/${id}`, data);
  }
  deleteEtablissement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/etablissements/${id}`);
  }
  uploadEtablissementFile(id: number, fileType: string, file: File): Observable<EtablissementCentre> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<EtablissementCentre>(`${this.api}/etablissements/${id}/files/${fileType}`, fd);
  }

  // ---- PROGRAMMES ----
  getProgrammes(): Observable<Programme[]> {
    return this.http.get<Programme[]>(`${this.api}/programmes`);
  }
  createProgramme(data: any): Observable<Programme> {
    return this.http.post<Programme>(`${this.api}/programmes`, data);
  }
  updateProgramme(id: number, data: any): Observable<Programme> {
    return this.http.put<Programme>(`${this.api}/programmes/${id}`, data);
  }
  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/programmes/${id}`);
  }
  getPrestationsByProgramme(programmeId: number): Observable<Prestation[]> {
    return this.http.get<Prestation[]>(`${this.api}/programmes/${programmeId}/prestations`);
  }
  createPrestation(programmeId: number, data: any): Observable<Prestation> {
    return this.http.post<Prestation>(`${this.api}/programmes/${programmeId}/prestations`, data);
  }
  deletePrestation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/programmes/prestations/${id}`);
  }

  // ---- PARTENAIRES ----
  getPartenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.api}/partenaires`);
  }
  createPartenaire(data: any): Observable<Partenaire> {
    return this.http.post<Partenaire>(`${this.api}/partenaires`, data);
  }
  updatePartenaire(id: number, data: any): Observable<Partenaire> {
    return this.http.put<Partenaire>(`${this.api}/partenaires/${id}`, data);
  }
  deletePartenaire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/partenaires/${id}`);
  }

  // ---- SUBVENTIONS ----
  getSubventions(): Observable<Subvention[]> {
    return this.http.get<Subvention[]>(`${this.api}/subventions`);
  }
  createSubvention(data: any): Observable<Subvention> {
    return this.http.post<Subvention>(`${this.api}/subventions`, data);
  }
  updateSubvention(id: number, data: any): Observable<Subvention> {
    return this.http.put<Subvention>(`${this.api}/subventions/${id}`, data);
  }
  deleteSubvention(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/subventions/${id}`);
  }

  // ---- PERSONNEL ----
  getPersonnel(): Observable<Personnel[]> {
    return this.http.get<Personnel[]>(`${this.api}/personnel`);
  }
  getPersonnelById(id: number): Observable<Personnel> {
    return this.http.get<Personnel>(`${this.api}/personnel/${id}`);
  }
  createPersonnel(data: any): Observable<Personnel> {
    return this.http.post<Personnel>(`${this.api}/personnel`, data);
  }
  updatePersonnel(id: number, data: any): Observable<Personnel> {
    return this.http.put<Personnel>(`${this.api}/personnel/${id}`, data);
  }
  deletePersonnel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/personnel/${id}`);
  }
  uploadPersonnelPhoto(id: number, file: File): Observable<Personnel> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<Personnel>(`${this.api}/personnel/${id}/photo`, fd);
  }

  // ---- FORMATIONS ----
  getFormations(): Observable<FormationContinue[]> {
    return this.http.get<FormationContinue[]>(`${this.api}/formations`);
  }
  createFormation(data: any): Observable<FormationContinue> {
    return this.http.post<FormationContinue>(`${this.api}/formations`, data);
  }
  updateFormation(id: number, data: any): Observable<FormationContinue> {
    return this.http.put<FormationContinue>(`${this.api}/formations/${id}`, data);
  }
  deleteFormation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/formations/${id}`);
  }

  // ---- BENEFICIAIRES ----
  getBeneficiaires(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(`${this.api}/beneficiaires`);
  }
  searchBeneficiaires(params: BeneficiaireSearchParams): Observable<Beneficiaire[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, v); });
    return this.http.get<Beneficiaire[]>(`${this.api}/beneficiaires/search`, { params: httpParams });
  }
  getBeneficiaire(id: number): Observable<Beneficiaire> {
    return this.http.get<Beneficiaire>(`${this.api}/beneficiaires/${id}`);
  }
  createBeneficiaire(data: any): Observable<Beneficiaire> {
    return this.http.post<Beneficiaire>(`${this.api}/beneficiaires`, data);
  }
  updateBeneficiaire(id: number, data: any): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(`${this.api}/beneficiaires/${id}`, data);
  }
  deleteBeneficiaire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/beneficiaires/${id}`);
  }
  uploadBeneficiairePhoto(id: number, file: File): Observable<Beneficiaire> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<Beneficiaire>(`${this.api}/beneficiaires/${id}/photo`, fd);
  }

  // Sub-situations
  getSituationsMedicales(id: number): Observable<SituationMedicale[]> {
    return this.http.get<SituationMedicale[]>(`${this.api}/beneficiaires/${id}/situations-medicales`);
  }
  addSituationMedicale(id: number, data: any): Observable<SituationMedicale> {
    return this.http.post<SituationMedicale>(`${this.api}/beneficiaires/${id}/situations-medicales`, data);
  }
  getSituationsSociales(id: number): Observable<SituationSociale[]> {
    return this.http.get<SituationSociale[]>(`${this.api}/beneficiaires/${id}/situations-sociales`);
  }
  addSituationSociale(id: number, data: any): Observable<SituationSociale> {
    return this.http.post<SituationSociale>(`${this.api}/beneficiaires/${id}/situations-sociales`, data);
  }
  getSituationsJudiciaires(id: number): Observable<SituationJudiciaire[]> {
    return this.http.get<SituationJudiciaire[]>(`${this.api}/beneficiaires/${id}/situations-judiciaires`);
  }
  addSituationJudiciaire(id: number, data: any): Observable<SituationJudiciaire> {
    return this.http.post<SituationJudiciaire>(`${this.api}/beneficiaires/${id}/situations-judiciaires`, data);
  }
  getDossiersScolaires(id: number): Observable<DossierScolaire[]> {
    return this.http.get<DossierScolaire[]>(`${this.api}/beneficiaires/${id}/dossiers-scolaires`);
  }
  addDossierScolaire(id: number, data: any): Observable<DossierScolaire> {
    return this.http.post<DossierScolaire>(`${this.api}/beneficiaires/${id}/dossiers-scolaires`, data);
  }
  getAccompagnements(id: number): Observable<Accompagnement[]> {
    return this.http.get<Accompagnement[]>(`${this.api}/beneficiaires/${id}/accompagnements`);
  }
  addAccompagnement(id: number, data: any): Observable<Accompagnement> {
    return this.http.post<Accompagnement>(`${this.api}/beneficiaires/${id}/accompagnements`, data);
  }
  getBesoins(id: number): Observable<BesoinExprime[]> {
    return this.http.get<BesoinExprime[]>(`${this.api}/beneficiaires/${id}/besoins`);
  }
  addBesoin(id: number, data: any): Observable<BesoinExprime> {
    return this.http.post<BesoinExprime>(`${this.api}/beneficiaires/${id}/besoins`, data);
  }

  // ---- DASHBOARD ----
  getDashboard(): Observable<any> {
    return this.http.get(`${this.api}/dashboard`);
  }

  // ---- EXPORT ----
  exportExcel(type: string): Observable<Blob> {
    return this.http.get(`${this.api}/export/excel/${type}`, { responseType: 'blob' });
  }
  exportPdf(type: string): Observable<Blob> {
    return this.http.get(`${this.api}/export/pdf/${type}`, { responseType: 'blob' });
  }
  exportBeneficiaireFiche(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/export/pdf/beneficiaire/${id}`, { responseType: 'blob' });
  }

  uploadFormationAttestation(id: number, file: File): Observable<FormationContinue> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<FormationContinue>(`${this.api}/formations/${id}/attestation`, fd);
  }

  // Prestations bénéficiaire
  getPrestationsBeneficiaire(id: number): Observable<PrestationBeneficiaire[]> {
    return this.http.get<PrestationBeneficiaire[]>(`${this.api}/beneficiaires/${id}/prestations-beneficiaire`);
  }

  addPrestationBeneficiaire(id: number, data: any): Observable<PrestationBeneficiaire> {
    return this.http.post<PrestationBeneficiaire>(`${this.api}/beneficiaires/${id}/prestations-beneficiaire`, data);
  }

  uploadCertificatMedical(beneficiaireId: number, situationId: number, file: File): Observable<SituationMedicale> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<SituationMedicale>(`${this.api}/beneficiaires/${beneficiaireId}/situations-medicales/${situationId}/certificat`, fd);
  }

  uploadPieceJointeJudiciaire(beneficiaireId: number, situationId: number, file: File): Observable<SituationJudiciaire> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<SituationJudiciaire>(`${this.api}/beneficiaires/${beneficiaireId}/situations-judiciaires/${situationId}/piece-jointe`, fd);
  }

  uploadPieceJointeDossier(beneficiaireId: number, dossierId: number, file: File): Observable<DossierScolaire> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<DossierScolaire>(`${this.api}/beneficiaires/${beneficiaireId}/dossiers-scolaires/${dossierId}/piece-jointe`, fd);
  }

  uploadPieceJointePrestation(beneficiaireId: number, prestationId: number, file: File): Observable<PrestationBeneficiaire> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<PrestationBeneficiaire>(`${this.api}/beneficiaires/${beneficiaireId}/prestations-beneficiaire/${prestationId}/piece-jointe`, fd);
  }
 
}
