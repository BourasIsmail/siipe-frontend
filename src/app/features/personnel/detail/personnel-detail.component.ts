import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Personnel } from '../../../core/models/personnel.model';

@Component({
  selector: 'app-personnel-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div *ngIf="loading" class="flex-center" style="height:300px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <ng-container *ngIf="!loading && personnel">

      <!-- Header -->
      <div class="detail-header">
        <div class="header-left">
          <div class="avatar-large" [style.background]="avatarColor">
            {{ personnel.nom.charAt(0) }}{{ personnel.prenom.charAt(0) }}
          </div>
          <div>
            <h1>{{ personnel.nom }} {{ personnel.prenom }}</h1>
            <div class="meta-row">
              <span class="badge badge-blue">{{ formatEnum(personnel.grade) }}</span>
              <span class="badge badge-green">{{ formatEnum(personnel.fonction) }}</span>
              <span class="text-secondary">{{ personnel.matricule }}</span>
            </div>
            <div class="meta-row mt-1">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:#888">business</mat-icon>
              <span class="text-secondary">{{ personnel.etablissementCentreNom || '-' }}</span>
              <mat-icon style="font-size:16px;width:16px;height:16px;color:#888" *ngIf="personnel.provinceNom">location_on</mat-icon>
              <span class="text-secondary" *ngIf="personnel.provinceNom">{{ personnel.provinceNom }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/personnel">
            <mat-icon>arrow_back</mat-icon> Retour
          </button>
          <a class="btn btn-primary" [routerLink]="['/personnel', personnel.id, 'edit']" *ngIf="canEdit()">
            <mat-icon>edit</mat-icon> Modifier
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab==='identite'" (click)="activeTab='identite'">
          <mat-icon>person</mat-icon> Identité
        </button>
        <button class="tab" [class.active]="activeTab==='profil'" (click)="activeTab='profil'">
          <mat-icon>work</mat-icon> Profil professionnel
        </button>
        <button class="tab" [class.active]="activeTab==='evaluation'" (click)="activeTab='evaluation'">
          <mat-icon>star</mat-icon> Évaluation
        </button>
      </div>

      <!-- Tab: Identité -->
      <mat-card *ngIf="activeTab==='identite'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>Informations personnelles</h3>
              <div class="info-row"><span>Nom complet</span><strong>{{ personnel.nom }} {{ personnel.prenom }}</strong></div>
              <div class="info-row"><span>CIN</span><strong>{{ personnel.cin || '-' }}</strong></div>
              <div class="info-row"><span>Sexe</span><strong>{{ personnel.sexe === 'MASCULIN' ? 'Masculin' : personnel.sexe === 'FEMININ' ? 'Féminin' : '-' }}</strong></div>
              <div class="info-row"><span>Date de naissance</span><strong>{{ personnel.dateNaissance ? (personnel.dateNaissance | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>Lieu de naissance</span><strong>{{ personnel.lieuNaissance || '-' }}</strong></div>
              <div class="info-row"><span>Situation familiale</span><strong>{{ formatEnum(personnel.situationFamille) }}</strong></div>
              <div class="info-row"><span>Nombre d'enfants</span><strong>{{ personnel.nombreEnfant ?? '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Contact</h3>
              <div class="info-row"><span>Email</span><strong>{{ personnel.email || '-' }}</strong></div>
              <div class="info-row"><span>Téléphone</span><strong>{{ personnel.telephone || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Formation</h3>
              <div class="info-row"><span>Niveau scolaire</span><strong>{{ formatEnum(personnel.niveauScolaire) }}</strong></div>
              <div class="info-row"><span>Diplôme</span><strong>{{ personnel.diplome || '-' }}</strong></div>
            </div>
          </div>

          <!-- Photo upload -->
          <div class="photo-section" *ngIf="canEdit()">
            <h3>Photo</h3>
            <div class="photo-upload">
              <img *ngIf="personnel.photoUrl" [src]="getFileUrl(personnel.photoUrl)"
                   class="photo-preview" alt="Photo">
              <div class="upload-zone">
                <label class="upload-btn">
                  <mat-icon>upload</mat-icon>
                  <span>{{ personnel.photoUrl ? 'Changer la photo' : 'Ajouter une photo' }}</span>
                  <input type="file" hidden accept="image/*" (change)="uploadPhoto($event)">
                </label>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Profil professionnel -->
      <mat-card *ngIf="activeTab==='profil'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>Situation administrative</h3>
              <div class="info-row"><span>Matricule</span><strong>{{ personnel.matricule }}</strong></div>
              <div class="info-row"><span>N° couverture sociale</span><strong>{{ personnel.numCouvertureSociale || '-' }}</strong></div>
              <div class="info-row"><span>Situation</span><strong>{{ personnel.situationAdministratif || '-' }}</strong></div>
              <div class="info-row"><span>Date de recrutement</span><strong>{{ personnel.dateRecrutement ? (personnel.dateRecrutement | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>Salaire</span><strong>{{ personnel.salaire ? (personnel.salaire | number) + ' MAD' : '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Poste & Grade</h3>
              <div class="info-row"><span>Grade</span><strong>{{ formatEnum(personnel.grade) }}</strong></div>
              <div class="info-row"><span>Fonction</span><strong>{{ formatEnum(personnel.fonction) }}</strong></div>
              <div class="info-row"><span>Poste occupé</span><strong>{{ formatEnum(personnel.posteOccupe) }}</strong></div>
              <div class="info-row"><span>Catégorie</span><strong>{{ personnel.categorie || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Affectation</h3>
              <div class="info-row"><span>Établissement</span><strong>{{ personnel.etablissementCentreNom || '-' }}</strong></div>
              <div class="info-row"><span>Province</span><strong>{{ personnel.provinceNom || '-' }}</strong></div>
              <div class="info-row"><span>Programme</span><strong>{{ personnel.programmeNom || '-' }}</strong></div>
              <div class="info-row"><span>Prestation</span><strong>{{ personnel.prestationNom || '-' }}</strong></div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Évaluation -->
      <mat-card *ngIf="activeTab==='evaluation'" class="tab-card">
        <mat-card-content>
          <div class="eval-header">
            <h3>Scores d'évaluation</h3>
            <div class="overall-score">
              <div class="score-circle" [style.background]="getScoreColor(overallScore)">
                {{ overallScore | number:'1.1-1' }}
              </div>
              <span class="text-secondary">Score global / 5</span>
            </div>
          </div>

          <div class="eval-grid">
            <div class="eval-item" *ngFor="let item of evalItems">
              <div class="eval-label">{{ item.label }}</div>
              <div class="eval-bar-wrap">
                <div class="eval-bar" [style.width.%]="(item.value || 0) * 20"
                     [style.background]="getScoreColor(item.value || 0)"></div>
              </div>
              <div class="eval-score">{{ item.value ?? '-' }}/5</div>
            </div>
          </div>

          <div class="observations mt-3" *ngIf="hasObservations()">
            <h3>Observations</h3>
            <div class="obs-grid">
              <div class="obs-item" *ngFor="let obs of observations; let i = index" [hidden]="!obs">
                <div class="obs-label">Observation {{ i + 1 }}</div>
                <div class="obs-text">{{ obs }}</div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Audit -->
      <div class="audit-info">
        <span>Créé par {{ personnel.createdBy }} le {{ personnel.createdAt | date:'dd/MM/yyyy' }}</span>
        <span *ngIf="personnel.updatedAt"> — Modifié le {{ personnel.updatedAt | date:'dd/MM/yyyy' }}</span>
      </div>

    </ng-container>
  `,
  styles: [`
    .detail-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .avatar-large {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 24px; font-weight: 700; flex-shrink: 0;
    }
    h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 8px; }
    .meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mt-1 { margin-top: 6px; }
    .header-actions { display: flex; gap: 8px; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: 6px; font-size: 14px;
      font-family: inherit; cursor: pointer; text-decoration: none; border: none;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-outline { background: white; color: #555; border: 1px solid #ccc; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .badge {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
    }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .tabs {
      display: flex; gap: 4px; margin-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
    }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border: none; background: none;
      cursor: pointer; font-size: 14px; color: #666;
      border-bottom: 3px solid transparent; margin-bottom: -2px;
      font-family: inherit; border-radius: 4px 4px 0 0;
    }
    .tab:hover { background: #f5f5f5; color: var(--color-primary); }
    .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
    .tab mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-card { border-radius: 0 8px 8px 8px !important; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;
    }
    .info-section h3 {
      color: var(--color-primary); font-size: 14px; font-weight: 600;
      border-bottom: 1px solid #e8f5e9; padding-bottom: 8px; margin-bottom: 12px;
    }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; border-bottom: 1px solid #fafafa; font-size: 14px;
      span { color: #666; }
      strong { color: #333; text-align: right; max-width: 60%; }
    }
    .photo-section { margin-top: 24px; }
    .photo-section h3 { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }
    .photo-upload { display: flex; align-items: center; gap: 16px; }
    .photo-preview { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; }
    .upload-btn {
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      padding: 10px 16px; border: 1px dashed #ccc; border-radius: 8px;
      color: #666; font-size: 14px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

    .eval-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
      h3 { color: var(--color-primary); font-size: 16px; }
    }
    .overall-score { display: flex; align-items: center; gap: 12px; }
    .score-circle {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; font-weight: 700;
    }
    .eval-grid { display: flex; flex-direction: column; gap: 12px; }
    .eval-item { display: flex; align-items: center; gap: 12px; }
    .eval-label { width: 220px; font-size: 14px; color: #555; flex-shrink: 0; }
    .eval-bar-wrap {
      flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;
    }
    .eval-bar { height: 100%; border-radius: 5px; transition: width 0.3s; }
    .eval-score { width: 40px; text-align: right; font-size: 14px; font-weight: 600; color: #333; }
    .observations h3 { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }
    .obs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
    .obs-item { background: #f9f9f9; border-radius: 8px; padding: 12px; }
    .obs-label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .obs-text { font-size: 14px; color: #333; }
    .audit-info {
      margin-top: 16px; font-size: 12px; color: #bbb;
      text-align: right; padding-bottom: 32px;
    }
  `]
})
export class PersonnelDetailComponent implements OnInit {
  personnel: Personnel | null = null;
  loading = true;
  activeTab = 'identite';
  avatarColor = '#2e7d32';

  readonly avatarColors = ['#2e7d32','#1565c0','#6a1b9a','#e65100','#00838f'];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.getPersonnelById(+id).subscribe({
      next: p => {
        this.personnel = p;
        const idx = (p.nom.charCodeAt(0) + p.prenom.charCodeAt(0)) % this.avatarColors.length;
        this.avatarColor = this.avatarColors[idx];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
  }

  get evalItems() {
    if (!this.personnel) return [];
    return [
      { label: 'Organisation', value: this.personnel.organisation },
      { label: 'Activité', value: this.personnel.activite },
      { label: 'Spécialisation', value: this.personnel.specialisation },
      { label: 'Initiative', value: this.personnel.initiative },
      { label: 'Autonomie', value: this.personnel.autonomie },
      { label: 'Adaptation professionnelle', value: this.personnel.adaptationProfessionnelle },
      { label: 'Relations de travail', value: this.personnel.relationsTravail },
      { label: 'Technique d\'exécution', value: this.personnel.techniqueExecution },
      { label: 'Communication', value: this.personnel.communication },
      { label: 'Tolérance au stress', value: this.personnel.toleranceStress },
      { label: 'Assiduité & Pointage', value: this.personnel.assiduitePointage },
      { label: 'Service à la population', value: this.personnel.servicePopulation },
    ];
  }

  get overallScore(): number {
    const scores = this.evalItems.map(i => i.value || 0).filter(v => v > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  get observations(): string[] {
    if (!this.personnel) return [];
    return [
      this.personnel.observation1 || '',
      this.personnel.observation2 || '',
      this.personnel.observation3 || '',
    ];
  }

  hasObservations(): boolean {
    return this.observations.some(o => o.length > 0);
  }

  getScoreColor(score: number): string {
    if (score >= 4) return '#2e7d32';
    if (score >= 3) return '#f57c00';
    if (score >= 2) return '#e65100';
    return '#c62828';
  }

  uploadPhoto(event: any) {
    const file = event.target.files[0];
    if (!file || !this.personnel) return;
    this.api.uploadPersonnelPhoto(this.personnel.id, file).subscribe({
      next: p => {
        this.personnel = p;
        this.snackBar.open('Photo mise à jour', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  getFileUrl(path: string): string {
    return `http://localhost:8080/api/files?path=${path}`;
  }

  formatEnum(val: string | undefined): string {
    if (!val) return '-';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  canEdit() { return this.auth.canEditPersonnel(); }
}
