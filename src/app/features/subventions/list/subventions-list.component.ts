import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Subvention, Partenaire, EtablissementCentre, Programme } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-subventions-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'SUBVENTION.LIST.TITLE' | translate }}</h1>
      <button class="btn btn-primary" (click)="openForm()" *ngIf="canEdit()">
        <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-row mb-2">
      <div class="stat-mini">
        <span class="stat-val">{{ all.length }}</span>
        <span class="stat-lbl">{{ 'SUBVENTION.LIST.STAT_TOTAL' | translate }}</span>
      </div>
      <div class="stat-mini green">
        <span class="stat-val">{{ countByStatut('EN_COURS') }}</span>
        <span class="stat-lbl">{{ 'SUBVENTION.LIST.STATUTS.EN_COURS' | translate }}</span>
      </div>
      <div class="stat-mini blue">
        <span class="stat-val">{{ totalMontant | number:'1.0-0' }} MAD</span>
        <span class="stat-lbl">{{ 'SUBVENTION.LIST.STAT_MONTANT_TOTAL' | translate }}</span>
      </div>
      <div class="stat-mini orange">
        <span class="stat-val">{{ countByStatut('TERMINEE') }}</span>
        <span class="stat-lbl">{{ 'SUBVENTION.LIST.STATUTS.TERMINEE' | translate }}</span>
      </div>
    </div>

    <!-- Filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'SUBVENTION.LIST.TITRE' | translate }}</label>
            <input type="text" [(ngModel)]="filterTitre" (ngModelChange)="applyFilter()" [placeholder]="'SUBVENTION.LIST.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'SUBVENTION.LIST.STATUT' | translate }}</label>
            <select [(ngModel)]="filterStatut" (ngModelChange)="applyFilter()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="EN_COURS">{{ 'SUBVENTION.LIST.STATUTS.EN_COURS' | translate }}</option>
              <option value="TERMINEE">{{ 'SUBVENTION.LIST.STATUTS.TERMINEE' | translate }}</option>
              <option value="SUSPENDUE">{{ 'SUBVENTION.LIST.STATUTS.SUSPENDUE' | translate }}</option>
              <option value="ANNULEE">{{ 'SUBVENTION.LIST.STATUTS.ANNULEE' | translate }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'SUBVENTION.LIST.PARTENAIRE' | translate }}</label>
            <select [(ngModel)]="filterPartenaireId" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option *ngFor="let p of partenaires" [ngValue]="p.id">{{ p.nomFr }}</option>
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

    <!-- Loading -->
    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- Add/Edit Form -->
    <mat-card class="mb-2" *ngIf="showForm">
      <mat-card-header>
        <mat-card-title>{{ (editingId ? 'COMMON.EDIT' : 'COMMON.ADD') | translate }} {{ 'SUBVENTION.LIST.FORM_TITLE' | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.TITRE' | translate }} *</label>
              <input type="text" formControlName="titre" [placeholder]="'SUBVENTION.LIST.TITRE_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('titre')?.invalid && form.get('titre')?.touched">{{ 'SUBVENTION.LIST.FIELD_REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.MONTANT_MAD' | translate }} *</label>
              <input type="number" formControlName="montant" placeholder="0">
              <span class="err" *ngIf="form.get('montant')?.invalid && form.get('montant')?.touched">{{ 'SUBVENTION.LIST.FIELD_REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.STATUT' | translate }}</label>
              <select formControlName="statut">
                <option value="">{{ 'SUBVENTION.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="EN_COURS">{{ 'SUBVENTION.LIST.STATUTS.EN_COURS' | translate }}</option>
                <option value="TERMINEE">{{ 'SUBVENTION.LIST.STATUTS.TERMINEE' | translate }}</option>
                <option value="SUSPENDUE">{{ 'SUBVENTION.LIST.STATUTS.SUSPENDUE' | translate }}</option>
                <option value="ANNULEE">{{ 'SUBVENTION.LIST.STATUTS.ANNULEE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.DATE_DEBUT' | translate }}</label>
              <input type="date" formControlName="dateDebut">
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.DATE_FIN' | translate }}</label>
              <input type="date" formControlName="dateFin">
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.PARTENAIRE' | translate }}</label>
              <select formControlName="partenaireId">
                <option value="">{{ 'SUBVENTION.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of partenaires" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.ETABLISSEMENT' | translate }}</label>
              <select formControlName="etablissementId">
                <option value="">{{ 'SUBVENTION.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'SUBVENTION.LIST.PROGRAMME' | translate }}</label>
              <select formControlName="programmeId">
                <option value="">{{ 'SUBVENTION.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
          <div class="field mb-2">
            <label>{{ 'SUBVENTION.LIST.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" rows="3" class="textarea" [placeholder]="'SUBVENTION.LIST.DESCRIPTION_PLACEHOLDER' | translate"></textarea>
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              <mat-spinner diameter="16" *ngIf="saving" style="display:inline-block;margin-right:6px"></mat-spinner>
              {{ saving ? '' : (editingId ? ('COMMON.SAVE' | translate) : ('SUBVENTION.LIST.CREATE' | translate)) }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Table -->
    <mat-card *ngIf="!loading">
      <mat-card-content>
        <div class="table-meta">
          <span class="text-secondary">{{ filtered.length }} {{ 'SUBVENTION.LIST.RESULTS' | translate }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'SUBVENTION.LIST.TITRE' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.MONTANT' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.STATUT' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.PARTENAIRE' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.ETABLISSEMENT' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.PROGRAMME' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.DATE_DEBUT' | translate }}</th>
                <th>{{ 'SUBVENTION.LIST.DATE_FIN' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of paginated">
                <td><strong>{{ s.titre }}</strong></td>
                <td><strong class="montant">{{ s.montant | number:'1.0-0' }} MAD</strong></td>
                <td>
                  <span class="badge" [ngClass]="getStatutClass(s.statut)">
                    {{ formatStatut(s.statut) }}
                  </span>
                </td>
                <td>{{ s.partenaireNom || '-' }}</td>
                <td>{{ s.etablissementNom || '-' }}</td>
                <td>{{ s.programmeNom || '-' }}</td>
                <td>{{ s.dateDebut ? (s.dateDebut | date:'dd/MM/yyyy') : '-' }}</td>
                <td>{{ s.dateFin ? (s.dateFin | date:'dd/MM/yyyy') : '-' }}</td>
                <td class="actions">
                  <button class="action-btn edit" (click)="openEditForm(s)" [title]="'COMMON.EDIT' | translate" *ngIf="canEdit()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="delete(s)" *ngIf="canDelete()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="9" class="empty-row">{{ 'SUBVENTION.LIST.EMPTY' | translate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" (click)="goToPage(0)" [disabled]="pageIndex===0">«</button>
          <button class="page-btn" (click)="goToPage(pageIndex-1)" [disabled]="pageIndex===0">‹</button>
          <button class="page-btn" *ngFor="let n of pageNumbers" [class.active]="n===pageIndex" (click)="goToPage(n)">{{ n+1 }}</button>
          <button class="page-btn" (click)="goToPage(pageIndex+1)" [disabled]="pageIndex>=totalPages-1">›</button>
          <button class="page-btn" (click)="goToPage(totalPages-1)" [disabled]="pageIndex>=totalPages-1">»</button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stats-row {
      display: flex; gap: 16px; flex-wrap: wrap;
    }
    .stat-mini {
      background: white; border-radius: 8px; padding: 16px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex;
      flex-direction: column; align-items: center; gap: 4px;
      border-left: 4px solid #ccc; min-width: 140px;
    }
    .stat-mini.green { border-left-color: var(--color-primary); }
    .stat-mini.blue { border-left-color: #1565c0; }
    .stat-mini.orange { border-left-color: #e65100; }
    .stat-val { font-size: 22px; font-weight: 700; color: var(--color-primary); }
    .stat-lbl { font-size: 12px; color: #888; }
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
    .table-meta { margin-bottom: 12px; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th {
      background: var(--color-primary); color: white;
      padding: 12px 14px; text-align: left; font-size: 13px;
      font-weight: 600; white-space: nowrap;
    }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9f9; }
    .montant { color: var(--color-primary); }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-orange { background: #fff3e0; color: #e65100; }
    .badge-red { background: #ffebee; color: #c62828; }
    .badge-gray { background: #f5f5f5; color: #555; }
    .actions { display: flex; gap: 4px; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; background: transparent; color: #666;
    }
    .action-btn.edit:hover { color: var(--color-primary); background: #e8f5e9; }
    .action-btn.delete:hover { color: #c62828; background: #ffebee; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-row { text-align: center; padding: 40px; color: #999; }
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
export class SubventionsListComponent implements OnInit {
  all: Subvention[] = [];
  filtered: Subvention[] = [];
  paginated: Subvention[] = [];
  partenaires: Partenaire[] = [];
  etablissements: EtablissementCentre[] = [];
  programmes: Programme[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editingId: number | null = null;
  pageSize = 10;
  pageIndex = 0;
  filterTitre = '';
  filterStatut = '';
  filterPartenaireId: number | null = null;
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
    this.api.getSubventions().subscribe({
      next: d => { this.all = d; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
    this.api.getPartenaires().subscribe({ next: p => { this.partenaires = [...p]; this.cdr.detectChanges(); } });
    this.api.getEtablissements().subscribe({ next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); } });
    this.api.getProgrammes().subscribe({ next: p => { this.programmes = [...p]; this.cdr.detectChanges(); } });
  }

  buildForm() {
    this.form = this.fb.group({
      titre: ['', Validators.required],
      montant: [null, Validators.required],
      statut: ['EN_COURS'],
      dateDebut: [''],
      dateFin: [''],
      description: [''],
      partenaireId: [''],
      etablissementId: [''],
      programmeId: ['']
    });
  }

  openForm() { this.showForm = true; this.editingId = null; this.form.reset({ statut: 'EN_COURS' }); }

  openEditForm(s: Subvention) {
    this.editingId = s.id;
    this.showForm = true;
    this.form.patchValue({
      ...s,
      partenaireId: s.partenaireId || '',
      etablissementId: s.etablissementId || '',
      programmeId: s.programmeId || ''
    });
  }

  closeForm() { this.showForm = false; this.editingId = null; this.form.reset(); }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.editingId
      ? this.api.updateSubvention(this.editingId, this.form.value)
      : this.api.createSubvention(this.form.value);

    req.subscribe({
      next: s => {
        if (this.editingId) {
          this.all = this.all.map(x => x.id === s.id ? s : x);
        } else {
          this.all.unshift(s);
        }
        this.applyFilter();
        this.saving = false;
        this.closeForm();
        this.snackBar.open(this.editingId ? this.translate.instant('SUBVENTION.LIST.UPDATED') : this.translate.instant('SUBVENTION.LIST.CREATED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' }); }
    });
  }

  delete(s: Subvention) {
    if (!confirm(this.translate.instant('SUBVENTION.LIST.CONFIRM_DELETE', { titre: s.titre }))) return;
    this.api.deleteSubvention(s.id).subscribe({
      next: () => { this.all = this.all.filter(x => x.id !== s.id); this.applyFilter(); this.snackBar.open(this.translate.instant('SUBVENTION.LIST.DELETED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  applyFilter() {
    this.filtered = this.all.filter(s => {
      const titre = !this.filterTitre || s.titre.toLowerCase().includes(this.filterTitre.toLowerCase());
      const statut = !this.filterStatut || s.statut === this.filterStatut;
      const partenaire = !this.filterPartenaireId || s.partenaireId === this.filterPartenaireId;
      return titre && statut && partenaire;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilter() { this.filterTitre = ''; this.filterStatut = ''; this.filterPartenaireId = null; this.applyFilter(); }

  get totalMontant() { return this.all.reduce((sum, s) => sum + (s.montant || 0), 0); }
  countByStatut(statut: string) { return this.all.filter(s => s.statut === statut).length; }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers() {
    const pages = []; const s = Math.max(0, this.pageIndex - 2); const e = Math.min(this.totalPages - 1, this.pageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i); return pages;
  }
  goToPage(i: number) { this.pageIndex = i; this.updatePage(); }
  updatePage() { const s = this.pageIndex * this.pageSize; this.paginated = this.filtered.slice(s, s + this.pageSize); }

  getStatutClass(statut: string | undefined): string {
    const map: Record<string, string> = {
      EN_COURS: 'badge-green', TERMINEE: 'badge-blue',
      SUSPENDUE: 'badge-orange', ANNULEE: 'badge-red'
    };
    return statut ? (map[statut] || 'badge-gray') : 'badge-gray';
  }

  formatStatut(statut: string | undefined): string {
    return statut ? this.translate.instant('SUBVENTION.LIST.STATUTS.' + statut) : '-';
  }

  isAdmin() { return this.auth.isAdmin(); }
  // Change this:
  canEdit() {
    return this.auth.hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }

// Keep delete only for admin and delegue:
  canDelete() { return this.auth.canDelete(); }
}
