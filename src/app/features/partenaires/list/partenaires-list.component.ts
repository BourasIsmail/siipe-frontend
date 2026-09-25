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
import { Partenaire } from '../../../core/models/etablissement.model';
import { Province } from '../../../core/models/geo.model';

@Component({
  selector: 'app-partenaires-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'PARTENAIRE.LIST.TITLE' | translate }}</h1>
      <button class="btn btn-primary" (click)="openForm()" *ngIf="canEdit()">
        <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
      </button>
    </div>

    <!-- Filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'PARTENAIRE.LIST.NOM' | translate }}</label>
            <input type="text" [(ngModel)]="filterNom" (ngModelChange)="applyFilter()" [placeholder]="'PARTENAIRE.LIST.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'PARTENAIRE.LIST.TYPE' | translate }}</label>
            <select [(ngModel)]="filterType" (ngModelChange)="applyFilter()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="ONG">{{ 'PARTENAIRE.LIST.TYPES.ONG' | translate }}</option>
              <option value="ASSOCIATION">{{ 'PARTENAIRE.LIST.TYPES.ASSOCIATION' | translate }}</option>
              <option value="INSTITUTION_PUBLIQUE">{{ 'PARTENAIRE.LIST.TYPES.INSTITUTION_PUBLIQUE' | translate }}</option>
              <option value="ENTREPRISE_PRIVEE">{{ 'PARTENAIRE.LIST.TYPES.ENTREPRISE_PRIVEE' | translate }}</option>
              <option value="ORGANISME_INTERNATIONAL">{{ 'PARTENAIRE.LIST.TYPES.ORGANISME_INTERNATIONAL' | translate }}</option>
              <option value="AUTRE">{{ 'PARTENAIRE.LIST.TYPES.AUTRE' | translate }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'PARTENAIRE.LIST.PROVINCE' | translate }}</label>
            <select [(ngModel)]="filterProvinceId" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">{{ 'PARTENAIRE.LIST.ALL_PROVINCES' | translate }}</option>
              <option *ngFor="let p of provinces" [ngValue]="p.id">{{ p.nomFr }}</option>
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
        <mat-card-title>{{ (editingId ? 'PARTENAIRE.LIST.FORM_TITLE_EDIT' : 'PARTENAIRE.LIST.FORM_TITLE_ADD') | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.NOM_FR_LABEL' | translate }}</label>
              <input type="text" formControlName="nomFr" [placeholder]="'PARTENAIRE.LIST.NOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('nomFr')?.invalid && form.get('nomFr')?.touched">{{ 'PARTENAIRE.LIST.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.NOM_AR_LABEL' | translate }}</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="الاسم">
              <span class="err" *ngIf="form.get('nomAr')?.invalid && form.get('nomAr')?.touched">{{ 'PARTENAIRE.LIST.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.TYPE' | translate }}</label>
              <select formControlName="type">
                <option value="">{{ 'PARTENAIRE.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="ONG">{{ 'PARTENAIRE.LIST.TYPES.ONG' | translate }}</option>
                <option value="ASSOCIATION">{{ 'PARTENAIRE.LIST.TYPES.ASSOCIATION' | translate }}</option>
                <option value="INSTITUTION_PUBLIQUE">{{ 'PARTENAIRE.LIST.TYPES.INSTITUTION_PUBLIQUE' | translate }}</option>
                <option value="ENTREPRISE_PRIVEE">{{ 'PARTENAIRE.LIST.TYPES.ENTREPRISE_PRIVEE' | translate }}</option>
                <option value="ORGANISME_INTERNATIONAL">{{ 'PARTENAIRE.LIST.TYPES.ORGANISME_INTERNATIONAL' | translate }}</option>
                <option value="AUTRE">{{ 'PARTENAIRE.LIST.TYPES.AUTRE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.RESPONSABLE' | translate }}</label>
              <input type="text" formControlName="responsable" [placeholder]="'PARTENAIRE.LIST.RESPONSABLE_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.TELEPHONE' | translate }}</label>
              <input type="text" formControlName="telephone" placeholder="0600000000">
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.EMAIL' | translate }}</label>
              <input type="email" formControlName="email" placeholder="contact@partenaire.ma">
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.ADRESSE' | translate }}</label>
              <input type="text" formControlName="adresse" [placeholder]="'PARTENAIRE.LIST.ADRESSE' | translate">
            </div>
            <div class="field">
              <label>{{ 'PARTENAIRE.LIST.PROVINCE' | translate }}</label>
              <select formControlName="provinceId">
                <option value="">{{ 'PARTENAIRE.LIST.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of provinces" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
          <div class="field mb-2">
            <label>{{ 'PARTENAIRE.LIST.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" rows="3" class="textarea" [placeholder]="'PARTENAIRE.LIST.DESCRIPTION_PLACEHOLDER' | translate"></textarea>
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              <mat-spinner diameter="16" *ngIf="saving" style="display:inline-block;margin-inline-end:6px"></mat-spinner>
              {{ saving ? '' : ((editingId ? 'COMMON.SAVE' : 'PARTENAIRE.LIST.CREATE') | translate) }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Table -->
    <mat-card *ngIf="!loading">
      <mat-card-content>
        <div class="table-meta">
          <span class="text-secondary">{{ filtered.length }} {{ 'PARTENAIRE.LIST.COUNT_SUFFIX' | translate }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'PARTENAIRE.LIST.NOM' | translate }}</th>
                <th>{{ 'PARTENAIRE.LIST.TYPE' | translate }}</th>
                <th>{{ 'PARTENAIRE.LIST.RESPONSABLE' | translate }}</th>
                <th>{{ 'PARTENAIRE.LIST.TELEPHONE' | translate }}</th>
                <th>{{ 'PARTENAIRE.LIST.EMAIL' | translate }}</th>
                <th>{{ 'PARTENAIRE.LIST.PROVINCE' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of paginated">
                <td>
                  <div class="name-cell">
                    <strong>{{ p.nomFr }}</strong>
                    <div class="sub-text" *ngIf="p.nomAr">{{ p.nomAr }}</div>
                  </div>
                </td>
                <td><span class="badge badge-blue">{{ formatType(p.type) }}</span></td>
                <td>{{ p.responsable || '-' }}</td>
                <td>{{ p.telephone || '-' }}</td>
                <td>{{ p.email || '-' }}</td>
                <td>{{ p.provinceNom || '-' }}</td>
                <td class="actions">
                  <button class="action-btn edit" (click)="openEditForm(p)" [title]="'COMMON.EDIT' | translate" *ngIf="canEdit()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="delete(p)" *ngIf="canDelete()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="7" class="empty-row">{{ 'PARTENAIRE.LIST.EMPTY' | translate }}</td>
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
      padding: 12px 14px; text-align: start; font-size: 13px; font-weight: 600;
    }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9f9; }
    .name-cell strong { display: block; }
    .sub-text { font-size: 12px; color: #999; direction: rtl; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
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
export class PartenairesListComponent implements OnInit {
  all: Partenaire[] = [];
  filtered: Partenaire[] = [];
  paginated: Partenaire[] = [];
  provinces: Province[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editingId: number | null = null;
  pageSize = 10;
  pageIndex = 0;
  filterNom = '';
  filterType = '';
  filterProvinceId: number | null = null;
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
    this.api.getPartenaires().subscribe({
      next: d => { this.all = d; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
    this.api.getProvinces().subscribe({
      next: p => { this.provinces = [...p]; this.cdr.detectChanges(); }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      nomFr: ['', Validators.required],
      nomAr: ['', Validators.required],
      type: [''],
      responsable: [''],
      telephone: [''],
      email: [''],
      adresse: [''],
      description: [''],
      provinceId: [''],
      regionId: ['']
    });
  }

  openForm() { this.showForm = true; this.editingId = null; this.form.reset(); }

  openEditForm(p: Partenaire) {
    this.editingId = p.id;
    this.showForm = true;
    this.form.patchValue(p);
  }

  closeForm() { this.showForm = false; this.editingId = null; this.form.reset(); }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.editingId
      ? this.api.updatePartenaire(this.editingId, this.form.value)
      : this.api.createPartenaire(this.form.value);

    req.subscribe({
      next: p => {
        if (this.editingId) {
          this.all = this.all.map(x => x.id === p.id ? p : x);
        } else {
          this.all.unshift(p);
        }
        this.applyFilter();
        this.saving = false;
        this.closeForm();
        this.snackBar.open(this.editingId ? this.translate.instant('PARTENAIRE.LIST.UPDATED') : this.translate.instant('PARTENAIRE.LIST.CREATED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' }); }
    });
  }

  delete(p: Partenaire) {
    if (!confirm(this.translate.instant('PARTENAIRE.LIST.CONFIRM_DELETE', { name: p.nomFr }))) return;
    this.api.deletePartenaire(p.id).subscribe({
      next: () => { this.all = this.all.filter(x => x.id !== p.id); this.applyFilter(); this.snackBar.open(this.translate.instant('PARTENAIRE.LIST.DELETED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  applyFilter() {
    this.filtered = this.all.filter(p => {
      const nom = !this.filterNom || p.nomFr.toLowerCase().includes(this.filterNom.toLowerCase());
      const type = !this.filterType || p.type === this.filterType;
      const province = !this.filterProvinceId || p.provinceId === this.filterProvinceId;
      return nom && type && province;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilter() { this.filterNom = ''; this.filterType = ''; this.filterProvinceId = null; this.applyFilter(); }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers() {
    const pages = []; const s = Math.max(0, this.pageIndex - 2); const e = Math.min(this.totalPages - 1, this.pageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i); return pages;
  }
  goToPage(i: number) { this.pageIndex = i; this.updatePage(); }
  updatePage() { const s = this.pageIndex * this.pageSize; this.paginated = this.filtered.slice(s, s + this.pageSize); }

  formatType(type: string | undefined): string {
    return type ? this.translate.instant('PARTENAIRE.LIST.TYPES.' + type) : '-';
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
