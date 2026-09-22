import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';
import '@maplibre/maplibre-gl-leaflet';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { buildSatelliteLabelsStyle, ESRI_WORLD_IMAGERY_URL } from '../../../shared/map/satellite-labels-style';
import { Province, Region } from '../../../core/models/geo.model';
import { Programme, Prestation } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-etablissement-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEdit ? 'Modifier' : 'Ajouter' }} un Établissement</h1>
      <button mat-button routerLink="/etablissements">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">

      <!-- Section 1: Identification -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Identification</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Nom du centre/Établissement (fr) *</label>
              <input type="text" formControlName="nomFr" placeholder="Nom en français">
              <span class="err" *ngIf="form.get('nomFr')?.invalid && form.get('nomFr')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Nom du centre/Établissement (ar) *</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="الاسم بالعربية">
              <span class="err" *ngIf="form.get('nomAr')?.invalid && form.get('nomAr')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Code</label>
              <input type="text" formControlName="code" placeholder="Code">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Téléphone</label>
              <input type="text" formControlName="telephone" placeholder="0600000000">
            </div>
            <div class="field">
              <label>Fax</label>
              <input type="text" formControlName="fax" placeholder="Fax">
            </div>
            <div class="field">
              <label>Adresse</label>
              <input type="text" formControlName="adresse" placeholder="Adresse">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Personne responsable du centre</label>
              <select formControlName="personneResponsableCentre">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let p of personnel" [value]="p.nom + ' ' + p.prenom">{{ p.nom }} {{ p.prenom }}</option>
              </select>
            </div>
            <div class="field">
              <label>Milieu</label>
              <select formControlName="milieu">
                <option value="">-- Sélectionner --</option>
                <option value="URBAIN">Urbain</option>
                <option value="RURAL">Rural</option>
              </select>
            </div>
            <div class="field">
              <label>Type de local</label>
              <select formControlName="typeLocal">
                <option value="">-- Sélectionner --</option>
                <option value="CENTRE_SOCIALE">Centre sociale</option>
                <option value="DELEGATION">Délégation</option>
                <option value="COORDINATION">Coordination</option>
                <option value="DEPOT">Dépôt</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Utilisation</label>
              <select formControlName="utilisation">
                <option value="">-- Sélectionner --</option>
                <option value="utilisé">Utilisé</option>
                <option value="non utilisé">Non utilisé</option>
                <option value="partiellement utilisé">Partiellement utilisé</option>
              </select>
            </div>
            <div class="field">
              <label>Loyer</label>
              <select formControlName="loyer">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field" *ngIf="form.get('loyer')?.value === 'true' || form.get('loyer')?.value === true">
              <label>Qui paie le loyer</label>
              <input type="text" formControlName="paieLoyer" placeholder="Payeur">
            </div>
          </div>
          <div class="form-row" *ngIf="form.get('loyer')?.value === 'true' || form.get('loyer')?.value === true">
            <div class="field">
              <label>Montant du loyer par mois (MAD)</label>
              <input type="number" formControlName="montantLoyer" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>État de construction</label>
              <select formControlName="etatConstruction">
                <option value="">-- Sélectionner --</option>
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="Mauvais">Mauvais</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 2: Localisation -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Localisation</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Région</label>
              <select formControlName="regionId" (change)="onRegionChange($event)">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let r of regions" [value]="r.id">{{ r.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>Province *</label>
              <select formControlName="provinceId">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let p of filteredProvinces" [value]="p.id">{{ p.nomFr }}</option>
              </select>
              <span class="err" *ngIf="form.get('provinceId')?.invalid && form.get('provinceId')?.touched">Champ requis</span>
            </div>
          </div>
          <div class="coords-row">
            <div class="field">
              <label>Coordonnées géographiques latitude</label>
              <input type="number" formControlName="latitude" placeholder="ex: 33.589" (change)="updateMarker()">
            </div>
            <div class="field">
              <label>Coordonnées géographiques longitude</label>
              <input type="number" formControlName="longitude" placeholder="ex: -7.603" (change)="updateMarker()">
            </div>
            <button type="button" class="btn btn-outline" (click)="locateMe()">
              <mat-icon>my_location</mat-icon> Ma position
            </button>
          </div>
          <div class="map-hint">
            <mat-icon>info_outline</mat-icon>
            Cliquez sur la carte pour définir la position
          </div>
          <div id="etab-map" class="map-container"></div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Données techniques -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Données techniques</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Propriété du centre</label>
              <select formControlName="proprietecentre">
                <option value="">-- Sélectionner --</option>
                <option value="ENTRAIDE">Entraide</option>
                <option value="COMMUNE">Commune</option>
                <option value="DOMAINE">Domaine</option>
                <option value="ASSOCIATION">Association</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div class="field">
              <label>Numéros titre foncier</label>
              <input type="text" formControlName="numerotitre" placeholder="Numéro">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Date d'achat</label>
              <input type="date" formControlName="dateAchat">
            </div>
            <div class="field">
              <label>Date d'exploitation immobilière</label>
              <input type="date" formControlName="dateExploitation">
            </div>
            <div class="field">
              <label>Date de construction</label>
              <input type="date" formControlName="dateConstruction">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Superficie totale du terrain (m²)</label>
              <input type="number" formControlName="superficieTerrain" placeholder="0">
            </div>
            <div class="field">
              <label>Surface bâtie (m²)</label>
              <input type="number" formControlName="surfaceBatie" placeholder="0">
            </div>
            <div class="field">
              <label>Superficie totale des étages (m²)</label>
              <input type="number" formControlName="superficieTotaleEtages" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Nombre des étages</label>
              <select formControlName="nombreEtage">
                <option value="">-- Sélectionner --</option>
                <option value="0">Sous-sol</option>
                <option value="1">1 étage</option>
                <option value="2">2 étages</option>
                <option value="3">3 étages</option>
                <option value="4">4 étages</option>
                <option value="5">5 étages+</option>
              </select>
            </div>
            <div class="field">
              <label>Composant</label>
              <input type="text" formControlName="composant" placeholder="Composant">
            </div>
            <div class="field">
              <label>Étages utilisés</label>
              <input type="text" formControlName="etagesUtilises" placeholder="Ex: RDC + 1er étage">
            </div>
          </div>
          <div class="form-row">
            <div class="field" style="grid-column:span 3">
              <label>Observation</label>
              <textarea formControlName="observation" rows="3" style="padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;width:100%"></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Raccordement eau potable</label>
              <select formControlName="raccordementEauPotable">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field">
              <label>Raccordement électricité</label>
              <select formControlName="raccordementElectricite">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Plan de situation</label>
              <select formControlName="planSituation">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field">
              <label>Plans d'architecture</label>
              <select formControlName="planArchitecture">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field">
              <label>Le bien fait-il l'objet d'un litige</label>
              <select formControlName="litige">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
          </div>
          <div class="form-row" *ngIf="form.get('litige')?.value === 'true' || form.get('litige')?.value === true">
            <div class="field">
              <label>Raisons du conflit</label>
              <input type="text" formControlName="raisonsConflit" placeholder="Raisons">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Évaluer le prix du bâtiment (MAD)</label>
              <input type="number" formControlName="prixBatiment" placeholder="0">
            </div>
            <div class="field">
              <label>Capacité Accueil</label>
              <input type="number" formControlName="capaciteAccueil" placeholder="0">
            </div>
            <div class="field">
              <label>Géré par</label>
              <select formControlName="gererPar">
                <option value="">-- Sélectionner --</option>
                <option value="EN">Entraide Nationale</option>
                <option value="ASSOCIATION">Association</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Autorisé</label>
              <select formControlName="autorise">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field" *ngIf="form.get('autorise')?.value === 'true' || form.get('autorise')?.value === true">
              <label>Numéro d'autorisation</label>
              <input type="text" formControlName="numeroAutorisation" placeholder="Numéro">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 4: Documents -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Documents</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Mappe cadastrale</label>
              <input type="file" (change)="onFileChange($event, 'mappeCadastrale')" style="padding:6px">
              <a *ngIf="existingFiles['mappeCadastrale']" [href]="getFileUrl(existingFiles['mappeCadastrale'])" target="_blank" class="file-link">Voir fichier actuel</a>
            </div>
            <div class="field">
              <label>Certificat de propriété</label>
              <input type="file" (change)="onFileChange($event, 'certificatPropriete')" style="padding:6px">
              <a *ngIf="existingFiles['certificatPropriete']" [href]="getFileUrl(existingFiles['certificatPropriete'])" target="_blank" class="file-link">Voir fichier actuel</a>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 5: Programmes & Prestations -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Programmes & Prestations</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <!-- Programmes checkboxes -->
            <div class="field">
              <label>Programmes</label>
              <div class="programmes-list">
                <label class="checkbox-label" *ngFor="let p of programmes">
                  <input type="checkbox"
                         [checked]="isProgrammeSelected(p.id)"
                         (change)="toggleProgramme(p.id, p)"
                         style="accent-color:var(--color-primary);width:16px;height:16px">
                  {{ p.nomFr }}
                </label>
              </div>
            </div>
          </div>

          <!-- Prestations per selected programme -->
          <div *ngFor="let prog of selectedProgrammes" class="programme-prestations">
            <div class="prog-label">
              <mat-icon>category</mat-icon>
              {{ prog.nomFr }} — Prestations
            </div>
            <div class="prestations-grid">
              <label class="checkbox-label" *ngFor="let pr of getPrestationsForProgramme(prog.id)">
                <input type="checkbox"
                       [checked]="isPrestationSelected(pr.id)"
                       (change)="togglePrestation(pr.id)"
                       style="accent-color:var(--color-primary);width:16px;height:16px">
                {{ pr.nomFr }}
              </label>
              <span *ngIf="getPrestationsForProgramme(prog.id).length === 0" class="text-secondary" style="font-size:13px">
                Aucune prestation pour ce programme
              </span>
            </div>
          </div>

          <div *ngIf="selectedProgrammes.length === 0" class="text-secondary" style="font-size:13px;margin-top:8px">
            Sélectionnez un programme pour voir ses prestations
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-button type="button" routerLink="/etablissements">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-right:8px"></mat-spinner>
          <span>{{ saving ? '' : (isEdit ? 'Enregistrer' : 'Créer') }}</span>
        </button>
      </div>

    </form>
  `,
  styles: [`
    .programmes-list {
      display: flex; flex-wrap: wrap; gap: 10px;
      padding: 10px; border: 1px solid #ccc; border-radius: 6px;
      min-height: 60px;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 13px; font-weight: 500; color: #555; }
    .field input, .field select {
      padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; background: white;
      color: #333; height: 42px;
    }
    .field input:focus, .field select:focus {
      outline: none; border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(46,125,50,0.12);
    }
    .field select[multiple] { height: auto; }
    .err { color: #d32f2f; font-size: 12px; }
    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 12px; margin-top: 16px; margin-bottom: 32px;
    }
    .coords-row {
      display: grid; grid-template-columns: 1fr 1fr auto;
      gap: 16px; align-items: end; margin-bottom: 12px;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 16px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer;
      background: white; color: #555; height: 42px;
    }
    .btn:hover { background: #f5f5f5; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .map-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #888; margin-bottom: 8px;
    }
    .map-hint mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .map-container {
      height: 380px; border-radius: 8px;
      border: 1px solid #ccc; z-index: 1;
    }
    .file-link { color: var(--color-primary); font-size: 12px; text-decoration: none; }
    .file-link:hover { text-decoration: underline; }
    .programme-prestations {
      margin-top: 16px; border: 1px solid #e0e0e0;
      border-radius: 8px; overflow: hidden;
    }
    .prog-label {
      display: flex; align-items: center; gap: 8px;
      background: #e8f5e9; color: var(--color-primary);
      padding: 8px 14px; font-weight: 600; font-size: 14px;
    }
    .prog-label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .prestations-grid {
      display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 14px;
    }
    .checkbox-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; color: #333; cursor: pointer;
    }
  `]
})
export class EtablissementFormComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;
  regions: Region[] = [];
  filteredProvinces: Province[] = [];
  provinces: Province[] = [];
  programmes: Programme[] = [];
  personnel: any[] = [];
  selectedProgrammes: Programme[] = [];
  prestationsMap: Map<number, Prestation[]> = new Map();
  selectedPrestationIds: number[] = [];
  map: any;
  marker: any;
  mapInitialized = false;
  pendingFiles: Record<string, File> = {};
  existingFiles: { mappeCadastrale: string; certificatPropriete: string } = {
    mappeCadastrale: '',
    certificatPropriete: ''
  };

  private readonly markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.buildForm();
    this.api.getRegions().subscribe({
      next: r => { this.regions = this.restrictToOwnProvince() ? this.onlyOwnRegion(r) : [...r]; this.cdr.detectChanges(); }
    });
    this.api.getProvinces().subscribe({
      next: p => {
        this.provinces = this.restrictToOwnProvince() ? this.onlyOwnProvince(p) : [...p];
        this.filteredProvinces = [...this.provinces];
        this.cdr.detectChanges();
      }
    });
    this.api.getProgrammes().subscribe({ next: p => { this.programmes = [...p]; this.cdr.detectChanges(); } });
    this.api.getPersonnel().subscribe({ next: p => { this.personnel = [...p]; this.cdr.detectChanges(); } });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id && this.restrictToOwnProvince()) {
      const user = this.auth.getCurrentUser();
      this.form.patchValue({ regionId: user?.regionId ?? '', provinceId: user?.provinceId ?? '' });
    }
    if (id) {
      this.isEdit = true;
      this.loading = true;
      this.api.getEtablissement(+id).subscribe({
        next: e => {
          this.form.patchValue(e);
          if (e.regionId) this.onRegionChange({ target: { value: e.regionId } });
          if (e.programmes && e.programmes.length > 0) {
            this.selectedProgrammes = [...e.programmes];
            this.selectedProgrammeIds = e.programmes.map((p: any) => +p.id);
            this.form.patchValue({ programmeIds: this.selectedProgrammeIds });
            e.programmes.forEach((p: any) => {
              this.api.getPrestationsByProgramme(p.id).subscribe(pr => {
                this.prestationsMap.set(+p.id, [...pr]);
                this.prestationsMap = new Map(this.prestationsMap);
                this.cdr.detectChanges();
              });
            });
          }
          if (e.prestationIds) {
            this.selectedPrestationIds = [...e.prestationIds];
          }
          this.existingFiles = {
            mappeCadastrale: e.mappeCadastraleUrl || '',
            certificatPropriete: e.certificatProprieteUrl || '',
          };
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => { if (!this.mapInitialized) this.initMap(); else this.updateMarker(); }, 300);
        },
        error: () => { this.loading = false; this.router.navigate(['/etablissements']); }
      });
    }
  }

  restrictToOwnProvince(): boolean {
    return this.auth.hasRole('ROLE_DELEGUE');
  }

  private onlyOwnProvince(provinces: Province[]): Province[] {
    const provinceId = this.auth.getCurrentUser()?.provinceId;
    return provinceId ? provinces.filter(p => p.id === provinceId) : [];
  }

  private onlyOwnRegion(regions: Region[]): Region[] {
    const regionId = this.auth.getCurrentUser()?.regionId;
    return regionId ? regions.filter(r => r.id === regionId) : [];
  }

  ngAfterViewInit() {
    if (!this.isEdit) setTimeout(() => this.initMap(), 300);
  }

  buildForm() {
    this.form = this.fb.group({
      nomFr: ['', Validators.required],
      nomAr: ['', Validators.required],
      code: [''],
      telephone: [''],
      fax: [''],
      adresse: [''],
      milieu: [''],
      typeLocal: [''],
      proprietecentre: [''],
      gererPar: [''],
      utilisation: [''],
      personneResponsableCentre: [''],
      regionId: [''],
      provinceId: ['', Validators.required],
      latitude: [null],
      longitude: [null],
      superficieTerrain: [null],
      surfaceBatie: [null],
      superficieTotaleEtages: [null],
      nombreEtage: [null],
      etagesUtilises: [''],
      composant: [''],
      capaciteAccueil: [null],
      etatConstruction: [''],
      observation: [''],
      dateConstruction: [''],
      dateExploitation: [''],
      dateAchat: [''],
      numerotitre: [''],
      loyer: [''],
      montantLoyer: [null],
      paieLoyer: [''],
      raccordementEauPotable: [''],
      raccordementElectricite: [''],
      planSituation: [''],
      planArchitecture: [''],
      litige: [''],
      raisonsConflit: [''],
      prixBatiment: [null],
      autorise: [''],
      numeroAutorisation: [''],
      programmeIds: [[]]
    });
  }

  onProgrammesChange(event: any) {
    const select = event.target as HTMLSelectElement;
    const selectedIds = Array.from(select.selectedOptions)
      .map((o: any) => parseInt(o.value, 10))
      .filter(id => !isNaN(id));

    console.log('selected ids:', selectedIds);
    console.log('programmes:', this.programmes);
    console.log('option values:', Array.from((event.target as HTMLSelectElement).options).map(o => o.value));
    this.selectedProgrammes = [...this.programmes.filter(p => selectedIds.includes(+p.id))];
    this.cdr.detectChanges();

    this.selectedProgrammes.forEach(p => {
      if (!this.prestationsMap.has(p.id)) {
        this.api.getPrestationsByProgramme(p.id).subscribe({
          next: pr => {
            this.prestationsMap.set(p.id, [...pr]);
            this.prestationsMap = new Map(this.prestationsMap);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  getPrestationsForProgramme(programmeId: number): Prestation[] {
    return this.prestationsMap.get(programmeId) || [];
  }

  isPrestationSelected(prestationId: number): boolean {
    return this.selectedPrestationIds.includes(prestationId);
  }

  togglePrestation(prestationId: number) {
    if (this.selectedPrestationIds.includes(prestationId)) {
      this.selectedPrestationIds = this.selectedPrestationIds.filter(id => id !== prestationId);
    } else {
      this.selectedPrestationIds.push(prestationId);
    }
  }

  onRegionChange(event: any) {
    if (this.restrictToOwnProvince()) return; // province choice is locked to the DELEGUE's own province
    const regionId = event.target?.value || event;
    if (!regionId) { this.filteredProvinces = [...this.provinces]; return; }
    this.api.getProvincesByRegion(+regionId).subscribe({
      next: p => { this.filteredProvinces = [...p]; this.cdr.detectChanges(); }
    });
  }

  onFileChange(event: any, fileType: string) {
    const file = event.target.files[0];
    if (file) this.pendingFiles[fileType] = file;
  }

  getFileUrl(path: string): string {
    return `http://localhost:8080/api/files?path=${path}`;
  }

  normalizeLng(lng: number): number {
    return ((lng + 180) % 360 + 360) % 360 - 180;
  }

  selectedProgrammeIds: number[] = [];

  isProgrammeSelected(id: number): boolean {
    return this.selectedProgrammeIds.includes(id);
  }

  toggleProgramme(id: number, programme: Programme) {
    if (this.selectedProgrammeIds.includes(id)) {
      this.selectedProgrammeIds = this.selectedProgrammeIds.filter(x => x !== id);
      this.selectedProgrammes = this.selectedProgrammes.filter(p => p.id !== id);
      // remove prestations of deselected programme
      const prests = this.prestationsMap.get(id) || [];
      this.selectedPrestationIds = this.selectedPrestationIds
        .filter(pid => !prests.map(p => p.id).includes(pid));
    } else {
      this.selectedProgrammeIds.push(id);
      this.selectedProgrammes = [...this.selectedProgrammes, programme];
      // load prestations
      if (!this.prestationsMap.has(id)) {
        this.api.getPrestationsByProgramme(id).subscribe({
          next: pr => {
            this.prestationsMap.set(id, [...pr]);
            this.prestationsMap = new Map(this.prestationsMap);
            this.cdr.detectChanges();
          }
        });
      }
    }
    this.form.patchValue({ programmeIds: this.selectedProgrammeIds });
    this.cdr.detectChanges();
  }

  initMap() {
    if (this.mapInitialized) return;
    const lat = this.form.get('latitude')?.value || 31.7917;
    const lng = this.form.get('longitude')?.value || -7.0926;

    this.map = L.map('etab-map', {
      zoomControl: true, worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1.0
    }).setView([lat, lng], 6);

    L.tileLayer(ESRI_WORLD_IMAGERY_URL, {
      attribution: 'Imagery © Esri', noWrap: true, maxZoom: 19
    }).addTo(this.map);

    L.maplibreGL({
      style: buildSatelliteLabelsStyle(),
      interactive: false
    }).addTo(this.map);

    if (this.form.get('latitude')?.value && this.form.get('longitude')?.value) {
      this.marker = L.marker([lat, lng], { icon: this.markerIcon, draggable: true }).addTo(this.map);
      this.map.setView([lat, lng], 12);
      this.bindDragEnd();
    }

    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = this.normalizeLng(e.latlng.lng);
      this.form.patchValue({ latitude: +lat.toFixed(6), longitude: +lng.toFixed(6) });
      if (this.marker) { this.marker.setLatLng([lat, lng]); }
      else {
        this.marker = L.marker([lat, lng], { icon: this.markerIcon, draggable: true }).addTo(this.map);
        this.bindDragEnd();
      }
    });

    this.mapInitialized = true;
  }

  bindDragEnd() {
    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      const lng = this.normalizeLng(pos.lng);
      this.form.patchValue({ latitude: +pos.lat.toFixed(6), longitude: +lng.toFixed(6) });
    });
  }

  updateMarker() {
    const lat = this.form.get('latitude')?.value;
    const lng = this.form.get('longitude')?.value;
    if (!lat || !lng || !this.map) return;
    if (this.marker) { this.marker.setLatLng([lat, lng]); }
    else {
      this.marker = L.marker([lat, lng], { icon: this.markerIcon, draggable: true }).addTo(this.map);
      this.bindDragEnd();
    }
    this.map.setView([lat, lng], 12);
  }

  locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = +pos.coords.latitude.toFixed(6);
      const lng = +pos.coords.longitude.toFixed(6);
      this.form.patchValue({ latitude: lat, longitude: lng });
      this.updateMarker();
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const data = {
      ...this.form.value,
      prestationIds: this.selectedPrestationIds
    };

    const request = this.isEdit
      ? this.api.updateEtablissement(+id!, data)
      : this.api.createEtablissement(data);

    request.subscribe({
      next: (etab) => {
        const fileUploads = Object.entries(this.pendingFiles);
        if (fileUploads.length > 0) {
          fileUploads.forEach(([type, file]) => {
            this.api.uploadEtablissementFile(etab.id, type, file).subscribe();
          });
        }
        this.snackBar.open(
          this.isEdit ? 'Établissement modifié' : 'Établissement créé',
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/etablissements']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
