import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Beneficiaire, SITUATIONS_DIFFICULTE } from '../../../core/models/beneficiaire.model';
import { EtablissementCentre } from '../../../core/models/etablissement.model';
import { Province } from '../../../core/models/geo.model';

@Component({
  selector: 'app-beneficiaires-search',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'BENEFICIAIRE.SEARCH.TITLE' | translate }}</h1>
      <div class="flex gap-2">
        <button class="btn btn-excel" (click)="exportExcel()">
          <mat-icon>table_view</mat-icon> {{ 'COMMON.EXPORT_EXCEL' | translate }}
        </button>
        <button class="btn btn-pdf" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon> {{ 'COMMON.EXPORT_PDF' | translate }}
        </button>
        <a class="btn btn-primary" routerLink="/beneficiaires/add" *ngIf="canCreate()">
          <mat-icon>person_add</mat-icon> {{ 'BENEFICIAIRE.SEARCH.INSCRIRE' | translate }}
        </a>
      </div>
    </div>

    <!-- Search filters -->
    <mat-card class="mb-2">
      <mat-card-header>
        <mat-card-title>{{ 'BENEFICIAIRE.SEARCH.FILTERS_TITLE' | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'BENEFICIAIRE.NOM' | translate }}</label>
            <input type="text" [(ngModel)]="filters.nom" [placeholder]="'BENEFICIAIRE.SEARCH.NOM_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.PRENOM' | translate }}</label>
            <input type="text" [(ngModel)]="filters.prenom" [placeholder]="'BENEFICIAIRE.SEARCH.PRENOM_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.CIN' | translate }}</label>
            <input type="text" [(ngModel)]="filters.cin" [placeholder]="'BENEFICIAIRE.SEARCH.CIN_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SEXE' | translate }}</label>
            <select [(ngModel)]="filters.sexe">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="MASCULIN">{{ 'BENEFICIAIRE.MASCULIN' | translate }}</option>
              <option value="FEMININ">{{ 'BENEFICIAIRE.FEMININ' | translate }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SITUATION' | translate }}</label>
            <select [(ngModel)]="filters.situationDifficulte">
              <option value="">{{ 'BENEFICIAIRE.SEARCH.ALL_FEMININE' | translate }}</option>
              <option *ngFor="let s of situations" [value]="s">{{ formatEnum(s) }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.PROVINCE' | translate }}</label>
            <select [(ngModel)]="filters.provinceId">
              <option [ngValue]="null">{{ 'BENEFICIAIRE.SEARCH.ALL_FEMININE' | translate }}</option>
              <option *ngFor="let p of provinces" [ngValue]="p.id">{{ p.nomFr }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }}</label>
            <select [(ngModel)]="filters.etablissementId">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option *ngFor="let e of etablissements" [ngValue]="e.id">{{ e.nomFr }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SEARCH.DATE_NAISSANCE_FROM' | translate }}</label>
            <input type="date" [(ngModel)]="filters.dateNaissanceFrom">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SEARCH.DATE_NAISSANCE_TO' | translate }}</label>
            <input type="date" [(ngModel)]="filters.dateNaissanceTo">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SEARCH.DATE_ENTREE_FROM' | translate }}</label>
            <input type="date" [(ngModel)]="filters.dateEntreeFrom">
          </div>
          <div class="field">
            <label>{{ 'BENEFICIAIRE.SEARCH.DATE_ENTREE_TO' | translate }}</label>
            <input type="date" [(ngModel)]="filters.dateEntreeTo">
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline" (click)="resetFilters()">
            <mat-icon>clear</mat-icon> {{ 'COMMON.RESET' | translate }}
          </button>
          <button class="btn btn-primary" (click)="search()" [disabled]="loading">
            <mat-icon>search</mat-icon> {{ 'COMMON.SEARCH' | translate }}
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Loading -->
    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- Results -->
    <mat-card *ngIf="!loading && searched">
      <mat-card-content>
        <div class="table-meta">
          <span class="text-secondary">{{ filtered.length }} {{ 'BENEFICIAIRE.SEARCH.RESULTS' | translate }}</span>
          <div class="pagination-controls">
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="page-size-select">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-secondary">{{ 'BENEFICIAIRE.SEARCH.PER_PAGE' | translate }}</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
            <tr>
              <th>{{ 'BENEFICIAIRE.SEARCH.NOM_PRENOM' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.CIN' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.SEXE' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.DATE_NAISSANCE' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.SITUATION' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.PROVINCE' | translate }}</th>
              <th>{{ 'BENEFICIAIRE.DATE_ENTREE' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
            </thead>
            <tbody>
            <tr *ngFor="let b of paginated">
              <td>
                <div class="person-cell">
                  <div class="avatar" [style.background]="getAvatarColor(b)">
                    {{ b.nom.charAt(0) }}{{ b.prenom.charAt(0) }}
                  </div>
                  <div>
                    <a [routerLink]="['/beneficiaires', b.id]" class="link">
                      {{ b.nom }} {{ b.prenom }}
                    </a>
                    <div class="sub-text" *ngIf="b.nomAr">{{ b.nomAr }} {{ b.prenomAr }}</div>
                  </div>
                </div>
              </td>
              <td>{{ b.cin || '-' }}</td>
              <td>{{ b.sexe === 'MASCULIN' ? 'M' : b.sexe === 'FEMININ' ? 'F' : '-' }}</td>
              <td>{{ b.dateNaissance ? (b.dateNaissance | date:'dd/MM/yyyy') : '-' }}</td>
              <td>
                  <span class="badge badge-situation" *ngIf="b.situationDifficulte">
                    {{ formatEnum(b.situationDifficulte) }}
                  </span>
                <span *ngIf="!b.situationDifficulte">-</span>
              </td>
              <td>{{ b.etablissementCentreNom || '-' }}</td>
              <td>{{ b.provinceNom || '-' }}</td>
              <td>{{ b.dateEntree ? (b.dateEntree | date:'dd/MM/yyyy') : '-' }}</td>
              <td class="actions">
                <a [routerLink]="['/beneficiaires', b.id]" class="action-btn" [title]="'BENEFICIAIRE.SEARCH.VIEW_FILE' | translate">
                  <mat-icon>folder_open</mat-icon>
                </a>
                <a [routerLink]="['/beneficiaires', b.id, 'edit']" class="action-btn edit"
                   [title]="'COMMON.EDIT' | translate" *ngIf="canCreate()">
                  <mat-icon>edit</mat-icon>
                </a>
                <button class="action-btn" [title]="'BENEFICIAIRE.SEARCH.FICHE_PDF' | translate" (click)="exportFiche(b.id)">
                  <mat-icon>print</mat-icon>
                </button>
                <button class="action-btn delete" (click)="delete(b)"
                        [title]="'COMMON.DELETE' | translate" *ngIf="canDelete()">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="paginated.length === 0">
              <td colspan="9" class="empty-row">{{ 'BENEFICIAIRE.SEARCH.EMPTY' | translate }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" (click)="goToPage(0)" [disabled]="pageIndex === 0">«</button>
          <button class="page-btn" (click)="goToPage(pageIndex - 1)" [disabled]="pageIndex === 0">‹</button>
          <button class="page-btn" *ngFor="let p of pageNumbers"
                  [class.active]="p === pageIndex" (click)="goToPage(p)">{{ p + 1 }}</button>
          <button class="page-btn" (click)="goToPage(pageIndex + 1)" [disabled]="pageIndex >= totalPages - 1">›</button>
          <button class="page-btn" (click)="goToPage(totalPages - 1)" [disabled]="pageIndex >= totalPages - 1">»</button>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Empty state before search -->
    <div *ngIf="!loading && !searched" class="empty-state-card">
      <mat-icon>search</mat-icon>
      <h3>{{ 'BENEFICIAIRE.SEARCH.EMPTY_STATE_TITLE' | translate }}</h3>
      <p>{{ 'BENEFICIAIRE.SEARCH.EMPTY_STATE_DESC' | translate }}</p>
      <button class="btn btn-primary" (click)="search()">
        <mat-icon>search</mat-icon> {{ 'BENEFICIAIRE.SEARCH.SHOW_ALL' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 13px; font-weight: 500; color: #555; }
    .field input, .field select {
      padding: 9px 12px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; background: white; height: 40px;
    }
    .field input:focus, .field select:focus {
      outline: none; border-color: var(--color-primary);
    }
    .filter-actions {
      display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer;
      font-weight: 500; text-decoration: none;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-primary:hover { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: default; }
    .btn-excel { background: #1e7e34; color: white; }
    .btn-pdf { background: #c62828; color: white; }
    .btn-outline { background: white; color: #666; border: 1px solid #ccc; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .table-meta {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-size-select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th {
      background: var(--color-primary); color: white;
      padding: 12px 14px; text-align: left; font-size: 13px;
      font-weight: 600; white-space: nowrap;
    }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9f9; }
    .person-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 600; flex-shrink: 0;
    }
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .sub-text { font-size: 12px; color: #999; direction: rtl; }
    .badge-situation {
      background: #fff3e0; color: #e65100;
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
    }
    .actions { display: flex; gap: 4px; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; background: transparent; color: #666; text-decoration: none;
    }
    .action-btn:hover { background: #f0f0f0; }
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
    .empty-state-card {
      text-align: center; padding: 60px 40px; background: white;
      border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      mat-icon { font-size: 64px; width: 64px; height: 64px; color: #e0e0e0; display: block; margin: 0 auto 16px; }
      h3 { color: #666; margin-bottom: 8px; }
      p { color: #999; font-size: 14px; margin-bottom: 24px; }
    }
  `]
})
export class BeneficiairesSearchComponent implements OnInit {
  filtered: Beneficiaire[] = [];
  paginated: Beneficiaire[] = [];
  provinces: Province[] = [];
  etablissements: EtablissementCentre[] = [];
  situations = SITUATIONS_DIFFICULTE;
  loading = false;
  searched = false;
  pageSize = 10;
  pageIndex = 0;

  filters = {
    nom: '',
    prenom: '',
    cin: '',
    sexe: '',
    situationDifficulte: '',
    provinceId: null as number | null,
    etablissementId: null as number | null,
    dateNaissanceFrom: '',
    dateNaissanceTo: '',
    dateEntreeFrom: '',
    dateEntreeTo: ''
  };

  readonly avatarColors = ['#2e7d32','#1565c0','#6a1b9a','#e65100','#00838f','#558b2f'];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.api.getProvinces().subscribe({
      next: p => { this.provinces = [...p]; this.cdr.detectChanges(); }
    });
    this.api.getEtablissements().subscribe({
      next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); }
    });
  }

  search() {
    this.loading = true;
    const params: any = {};
    if (this.filters.nom) params.nom = this.filters.nom;
    if (this.filters.prenom) params.prenom = this.filters.prenom;
    if (this.filters.cin) params.cin = this.filters.cin;
    if (this.filters.sexe) params.sexe = this.filters.sexe;
    if (this.filters.situationDifficulte) params.situationDifficulte = this.filters.situationDifficulte;
    if (this.filters.provinceId) params.provinceId = this.filters.provinceId;
    if (this.filters.etablissementId) params.etablissementId = this.filters.etablissementId;
    if (this.filters.dateNaissanceFrom) params.dateNaissanceFrom = this.filters.dateNaissanceFrom;
    if (this.filters.dateNaissanceTo) params.dateNaissanceTo = this.filters.dateNaissanceTo;
    if (this.filters.dateEntreeFrom) params.dateEntreeFrom = this.filters.dateEntreeFrom;
    if (this.filters.dateEntreeTo) params.dateEntreeTo = this.filters.dateEntreeTo;

    this.api.searchBeneficiaires(params).subscribe({
      next: data => {
        this.filtered = data;
        this.pageIndex = 0;
        this.updatePage();
        this.loading = false;
        this.searched = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.SEARCH.SEARCH_ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  resetFilters() {
    this.filters = {
      nom: '', prenom: '', cin: '', sexe: '',
      situationDifficulte: '', provinceId: null,
      etablissementId: null, dateNaissanceFrom: '',
      dateNaissanceTo: '', dateEntreeFrom: '', dateEntreeTo: ''
    };
    this.filtered = [];
    this.searched = false;
  }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }

  get pageNumbers() {
    const total = this.totalPages;
    const current = this.pageIndex;
    const pages = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(index: number) { this.pageIndex = index; this.updatePage(); }
  onPageSizeChange() { this.pageIndex = 0; this.updatePage(); }
  updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.paginated = this.filtered.slice(start, start + this.pageSize);
  }

  delete(b: Beneficiaire) {
    if (!confirm(this.translate.instant('BENEFICIAIRE.SEARCH.CONFIRM_DELETE', { nom: b.nom, prenom: b.prenom }))) return;
    this.api.deleteBeneficiaire(b.id).subscribe({
      next: () => {
        this.filtered = this.filtered.filter(x => x.id !== b.id);
        this.updatePage();
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.SEARCH.DELETED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  exportExcel() {
    this.api.exportExcel('beneficiaires').subscribe(blob => this.download(blob, 'beneficiaires.xlsx'));
  }

  exportPdf() {
    this.api.exportPdf('beneficiaires').subscribe(blob => this.download(blob, 'beneficiaires.pdf'));
  }

  exportFiche(id: number) {
    this.api.exportBeneficiaireFiche(id).subscribe(blob => this.download(blob, `fiche-beneficiaire-${id}.pdf`));
  }

  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  getAvatarColor(b: Beneficiaire): string {
    const index = (b.nom.charCodeAt(0) + b.prenom.charCodeAt(0)) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  formatEnum(val: string): string {
    if (!val) return '-';
    return this.translate.instant('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + val);
  }

  isAdmin() { return this.auth.isAdmin(); }
  // DIRECTEUR_CENTRALE is read-only on bénéficiaires
  canCreate() {
    return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']);
  }
  canDelete() { return this.auth.canDeleteBeneficiaire(); }
}
