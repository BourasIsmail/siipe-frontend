import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FormationContinue, Personnel } from '../../../core/models/personnel.model';
import { EtablissementCentre } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'FORMATION.LIST.TITLE' | translate }}</h1>
      <button class="btn btn-primary" (click)="openForm()" *ngIf="canEdit()">
        <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
      </button>
    </div>

    <!-- Filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'FORMATION.LIST.TITRE' | translate }}</label>
            <input type="text" [(ngModel)]="filterTitre" (ngModelChange)="applyFilter()" [placeholder]="'FORMATION.LIST.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'FORMATION.LIST.ETABLISSEMENT' | translate }}</label>
            <select [(ngModel)]="filterEtabId" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option *ngFor="let e of etablissements" [ngValue]="e.id">{{ e.nomFr }}</option>
            </select>
          </div>
          <div class="field" style="justify-content:flex-end;padding-top:20px">
            <button class="btn btn-outline" (click)="resetFilter()">
              <mat-icon>clear</mat-icon> {{ 'COMMON.RESET' | translate }}
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Add/Edit Form -->
    <mat-card class="mb-2" *ngIf="showForm">
      <mat-card-header>
        <mat-card-title>{{ (editingId ? 'FORMATION.LIST.EDIT_FORMATION' : 'FORMATION.LIST.NEW_FORMATION') | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="field">
              <label>{{ 'FORMATION.LIST.TITRE' | translate }} *</label>
              <input type="text" formControlName="titre" [placeholder]="'FORMATION.LIST.TITRE_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('titre')?.invalid && form.get('titre')?.touched">{{ 'FORMATION.LIST.FIELD_REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.ORGANISME' | translate }}</label>
              <input type="text" formControlName="organisme" [placeholder]="'FORMATION.LIST.ORGANISME_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.LIEU' | translate }}</label>
              <input type="text" formControlName="lieu" [placeholder]="'FORMATION.LIST.LIEU_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.DUREE_JOURS' | translate }}</label>
              <input type="number" formControlName="dureeJours" placeholder="0">
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.DATE_DEBUT' | translate }}</label>
              <input type="date" formControlName="dateDebut">
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.DATE_FIN' | translate }}</label>
              <input type="date" formControlName="dateFin">
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.ETABLISSEMENT' | translate }}</label>
              <select formControlName="etablissementCentreId">
                <option value="">{{ 'FORMATION.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'FORMATION.LIST.PARTICIPANTS' | translate }}</label>
              <select formControlName="participantIds" multiple style="height:120px">
                <option *ngFor="let p of personnel" [value]="p.id">{{ p.nom }} {{ p.prenom }} — {{ p.matricule }}</option>
              </select>
              <small class="text-secondary">{{ 'FORMATION.LIST.MULTISELECT_HINT' | translate }}</small>
            </div>
          </div>
          <div class="field mb-2">
            <label>{{ 'FORMATION.LIST.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" rows="3" class="textarea" [placeholder]="'FORMATION.LIST.DESCRIPTION_PLACEHOLDER' | translate"></textarea>
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              <mat-spinner diameter="16" *ngIf="saving" style="display:inline-block;margin-inline-end:6px"></mat-spinner>
              {{ saving ? '' : (editingId ? ('COMMON.SAVE' | translate) : ('FORMATION.LIST.CREATE' | translate)) }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Loading -->
    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- Cards -->
    <div class="formations-grid" *ngIf="!loading">
      <mat-card class="formation-card" *ngFor="let f of paginated">
        <mat-card-content>
          <div class="formation-header">
            <div>
              <h3>{{ f.titre }}</h3>
              <div class="formation-meta">
                <span *ngIf="f.organisme"><mat-icon>business</mat-icon>{{ f.organisme }}</span>
                <span *ngIf="f.lieu"><mat-icon>location_on</mat-icon>{{ f.lieu }}</span>
                <span *ngIf="f.dureeJours"><mat-icon>schedule</mat-icon>{{ f.dureeJours }} {{ 'FORMATION.LIST.JOURS' | translate }}</span>
              </div>
              <div class="formation-dates" *ngIf="f.dateDebut || f.dateFin">
                <mat-icon>event</mat-icon>
                {{ f.dateDebut ? (f.dateDebut | date:'dd/MM/yyyy') : '?' }}
                <span *ngIf="f.dateFin"> → {{ f.dateFin | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="text-secondary" style="font-size:13px;margin-top:4px" *ngIf="f.etablissementCentreNom">
                <mat-icon style="font-size:14px;width:14px;height:14px">business</mat-icon>
                {{ f.etablissementCentreNom }}
              </div>
            </div>
            <div class="formation-actions" *ngIf="canEdit()">
              <button class="action-btn edit" (click)="openEditForm(f)" [title]="'COMMON.EDIT' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="action-btn delete" (click)="delete(f)" [title]="'COMMON.DELETE' | translate">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="description-text" *ngIf="f.description">{{ f.description }}</div>

          <!-- Participants -->
          <div class="participants-section" *ngIf="f.participants && f.participants.length > 0">
            <div class="participants-label">
              <mat-icon>group</mat-icon> {{ f.participants.length }} {{ 'FORMATION.LIST.PARTICIPANTS_COUNT' | translate }}
            </div>
            <div class="participants-chips">
              <span class="chip" *ngFor="let p of f.participants">
                {{ p.nom }} {{ p.prenom }}
              </span>
            </div>
          </div>

          <!-- Upload attestation -->
          <div class="attestation-section">
            <a *ngIf="f.attestationUrl" [href]="getFileUrl(f.attestationUrl)" target="_blank" class="doc-link">
              <mat-icon>description</mat-icon> {{ 'FORMATION.LIST.VIEW_ATTESTATION' | translate }}
            </a>
            <label class="upload-btn" *ngIf="canEdit()">
              <mat-icon>upload</mat-icon>
              {{ (f.attestationUrl ? 'FORMATION.LIST.CHANGE_ATTESTATION' : 'FORMATION.LIST.ADD_ATTESTATION') | translate }}
              <input type="file" hidden (change)="uploadAttestation($event, f.id)">
            </label>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="empty-state" *ngIf="filtered.length === 0">
        <mat-icon>school</mat-icon>
        <p>{{ 'FORMATION.LIST.EMPTY' | translate }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" *ngIf="totalPages > 1">
      <button class="page-btn" (click)="goToPage(0)" [disabled]="pageIndex===0">«</button>
      <button class="page-btn" (click)="goToPage(pageIndex-1)" [disabled]="pageIndex===0">‹</button>
      <button class="page-btn" *ngFor="let n of pageNumbers" [class.active]="n===pageIndex" (click)="goToPage(n)">{{ n+1 }}</button>
      <button class="page-btn" (click)="goToPage(pageIndex+1)" [disabled]="pageIndex>=totalPages-1">›</button>
      <button class="page-btn" (click)="goToPage(totalPages-1)" [disabled]="pageIndex>=totalPages-1">»</button>
    </div>
  `,
  styles: [`
    .filter-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
      gap: 16px; align-items: end;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 13px; font-weight: 500; color: #555; }
    .field input, .field select {
      padding: 9px 12px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; background: white; height: 40px;
    }
    .field input:focus, .field select:focus { outline: none; border-color: var(--color-primary); }
    .field select[multiple] { height: auto; }
    .textarea {
      padding: 9px 12px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; width: 100%; resize: vertical;
    }
    .mb-2 { margin-bottom: 12px; }
    .form-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .form-btns { display: flex; justify-content: flex-end; gap: 8px; }
    .err { color: #d32f2f; font-size: 12px; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer; font-weight: 500;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-outline { background: white; color: #666; border: 1px solid #ccc; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .formations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px,1fr)); gap: 16px; }
    .formation-card { border-top: 3px solid var(--color-primary) !important; }
    .formation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .formation-header h3 { font-size: 15px; color: var(--color-primary); margin-bottom: 6px; }
    .formation-meta {
      display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #666; margin-bottom: 4px;
      span { display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .formation-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #555;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--color-primary); }
    }
    .formation-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; background: transparent; color: #666;
    }
    .action-btn.edit:hover { color: var(--color-primary); background: #e8f5e9; }
    .action-btn.delete:hover { color: #c62828; background: #ffebee; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .description-text { font-size: 13px; color: #666; margin-bottom: 12px; padding: 8px; background: #f9f9f9; border-radius: 4px; }
    .participants-section { margin-top: 12px; }
    .participants-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #555; font-weight: 500; margin-bottom: 8px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-primary); }
    }
    .participants-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      background: #e8f5e9; color: #2e7d32; padding: 3px 10px;
      border-radius: 12px; font-size: 12px;
    }
    .attestation-section {
      display: flex; align-items: center; gap: 12px; margin-top: 12px;
      padding-top: 12px; border-top: 1px solid #f0f0f0;
    }
    .doc-link {
      display: flex; align-items: center; gap: 4px;
      color: var(--color-primary); font-size: 13px; text-decoration: none;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .doc-link:hover { text-decoration: underline; }
    .upload-btn {
      display: flex; align-items: center; gap: 6px; cursor: pointer;
      color: #666; font-size: 13px; padding: 5px 10px;
      border: 1px dashed #ccc; border-radius: 6px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .empty-state {
      text-align: center; padding: 60px; color: #ccc; background: white;
      border-radius: 12px; grid-column: 1/-1;
      mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; }
    }
    .pagination { display: flex; justify-content: center; gap: 4px; margin-top: 16px; }
    .page-btn {
      padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px;
      background: white; cursor: pointer; font-size: 13px;
    }
    .page-btn:hover:not(:disabled) { background: #f0f0f0; }
    .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
  `]
})
export class FormationsListComponent implements OnInit {
  all: FormationContinue[] = [];
  filtered: FormationContinue[] = [];
  paginated: FormationContinue[] = [];
  etablissements: EtablissementCentre[] = [];
  personnel: Personnel[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editingId: number | null = null;
  pageSize = 9;
  pageIndex = 0;
  filterTitre = '';
  filterEtabId: number | null = null;
  form!: FormGroup;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.api.getFormations().subscribe({
      next: d => { this.all = d; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
    this.api.getEtablissements().subscribe({ next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); } });
    this.api.getPersonnel().subscribe({ next: p => { this.personnel = [...p]; this.cdr.detectChanges(); } });
  }

  buildForm() {
    this.form = this.fb.group({
      titre: ['', Validators.required],
      organisme: [''],
      lieu: [''],
      dureeJours: [null],
      dateDebut: [''],
      dateFin: [''],
      description: [''],
      etablissementCentreId: [''],
      participantIds: [[]]
    });
  }

  openForm() { this.showForm = true; this.editingId = null; this.form.reset(); }

  openEditForm(f: FormationContinue) {
    this.editingId = f.id;
    this.showForm = true;
    this.form.patchValue({
      ...f,
      etablissementCentreId: f.etablissementCentreId || '',
      participantIds: f.participants?.map(p => p.id) || []
    });
  }

  closeForm() { this.showForm = false; this.editingId = null; this.form.reset(); }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.editingId
      ? this.api.updateFormation(this.editingId, this.form.value)
      : this.api.createFormation(this.form.value);

    req.subscribe({
      next: f => {
        if (this.editingId) {
          this.all = this.all.map(x => x.id === f.id ? f : x);
        } else {
          this.all.unshift(f);
        }
        this.applyFilter();
        this.saving = false;
        this.closeForm();
        this.snackBar.open(this.editingId ? this.translate.instant('FORMATION.LIST.UPDATED') : this.translate.instant('FORMATION.LIST.CREATED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' }); }
    });
  }

  delete(f: FormationContinue) {
    if (!confirm(this.translate.instant('FORMATION.LIST.CONFIRM_DELETE', { titre: f.titre }))) return;
    this.api.deleteFormation(f.id).subscribe({
      next: () => { this.all = this.all.filter(x => x.id !== f.id); this.applyFilter(); this.snackBar.open(this.translate.instant('FORMATION.LIST.DELETED'), 'OK', { duration: 3000 }); this.cdr.detectChanges(); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  uploadAttestation(event: any, id: number) {
    const file = event.target.files[0];
    if (!file) return;
    this.api.uploadFormationAttestation(id, file).subscribe({
      next: f => { this.all = this.all.map(x => x.id === f.id ? f : x); this.applyFilter(); this.snackBar.open(this.translate.instant('FORMATION.LIST.ATTESTATION_UPLOADED'), 'OK', { duration: 3000 }); this.cdr.detectChanges(); },
      error: () => this.snackBar.open(this.translate.instant('FORMATION.LIST.UPLOAD_ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  applyFilter() {
    this.filtered = this.all.filter(f => {
      const titre = !this.filterTitre || f.titre.toLowerCase().includes(this.filterTitre.toLowerCase());
      const etab = !this.filterEtabId || f.etablissementCentreId === this.filterEtabId;
      return titre && etab;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilter() { this.filterTitre = ''; this.filterEtabId = null; this.applyFilter(); }

  getFileUrl(path: string): string { return `http://localhost:8080/api/files?path=${path}`; }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers() {
    const pages = []; const s = Math.max(0, this.pageIndex - 2); const e = Math.min(this.totalPages - 1, this.pageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i); return pages;
  }
  goToPage(i: number) { this.pageIndex = i; this.updatePage(); }
  updatePage() { const s = this.pageIndex * this.pageSize; this.paginated = this.filtered.slice(s, s + this.pageSize); }

  canEdit() { return this.auth.canManagePersonnel(); }
}
