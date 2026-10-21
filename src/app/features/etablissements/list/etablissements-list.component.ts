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
import { EtablissementCentre } from '../../../core/models/etablissement.model';
import { Province } from '../../../core/models/geo.model';

@Component({
  selector: 'app-etablissements-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'ETABLISSEMENT.TITLE' | translate }}</h1>
      <div class="flex gap-2">
        <button class="btn btn-excel" (click)="exportExcel()">
          <mat-icon>table_view</mat-icon> {{ 'COMMON.EXPORT_EXCEL' | translate }}
        </button>
        <button class="btn btn-pdf" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon> {{ 'COMMON.EXPORT_PDF' | translate }}
        </button>
        <button class="btn btn-primary" routerLink="/etablissements/add" *ngIf="canEdit()">
          <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
        </button>
      </div>
    </div>

    <!-- Search filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'ETABLISSEMENT.LIST.NOM' | translate }}</label>
            <input type="text" [(ngModel)]="filters.nom" (ngModelChange)="applyFilters()" [placeholder]="'ETABLISSEMENT.LIST.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'ETABLISSEMENT.PROVINCE' | translate }}</label>
            <select [(ngModel)]="filters.provinceId" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">{{ 'ETABLISSEMENT.LIST.ALL_PROVINCES' | translate }}</option>
              <option *ngFor="let p of provinces" [ngValue]="p.id">{{ p.nomFr }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'ETABLISSEMENT.TYPE_LOCAL' | translate }}</label>
            <select [(ngModel)]="filters.typeLocal" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option value="CENTRE_SOCIALE">{{ 'ETABLISSEMENT.TYPES.CENTRE_SOCIALE' | translate }}</option>
              <option value="DELEGATION">{{ 'ETABLISSEMENT.TYPES.DELEGATION' | translate }}</option>
              <option value="COORDINATION">{{ 'ETABLISSEMENT.TYPES.COORDINATION' | translate }}</option>
              <option value="DEPOT">{{ 'ETABLISSEMENT.TYPES.DEPOT' | translate }}</option>
              <option value="AUTRE">{{ 'ETABLISSEMENT.TYPES.AUTRE' | translate }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'ETABLISSEMENT.MILIEU' | translate }}</label>
            <select [(ngModel)]="filters.milieu" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option value="URBAIN">{{ 'ETABLISSEMENT.MILIEUX.URBAIN' | translate }}</option>
              <option value="RURAL">{{ 'ETABLISSEMENT.MILIEUX.RURAL' | translate }}</option>
            </select>
          </div>
          <div class="field" style="justify-content:flex-end;padding-top:20px">
            <button class="btn btn-outline" (click)="resetFilters()">
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

    <!-- Table -->
    <mat-card *ngIf="!loading">
      <mat-card-content>
        <div class="table-meta">
          <span class="text-secondary">{{ filtered.length }} {{ 'ETABLISSEMENT.LIST.RESULTS' | translate }}</span>
          <div class="pagination-controls">
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="page-size-select">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-secondary">{{ 'ETABLISSEMENT.LIST.PER_PAGE' | translate }}</span>
          </div>
        </div>

        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'ETABLISSEMENT.LIST.NOM' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.CODE' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.PROVINCE' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.MAP.FILTER_TYPE' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.MILIEU' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.CAPACITE' | translate }}</th>
                <th>{{ 'ETABLISSEMENT.TELEPHONE' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of paginated">
                <td>
                  <a [routerLink]="['/etablissements', e.id]" class="link">{{ e.nomFr }}</a>
                  <div class="sub-text">{{ e.nomAr }}</div>
                </td>
                <td>{{ e.code || '-' }}</td>
                <td>{{ e.provinceNom || '-' }}</td>
                <td><span class="badge badge-blue">{{ formatType(e.typeLocal) }}</span></td>
                <td><span class="badge" [class.badge-green]="e.milieu === 'URBAIN'" [class.badge-orange]="e.milieu === 'RURAL'">{{ e.milieu ? ('ETABLISSEMENT.MILIEUX.' + e.milieu | translate) : '-' }}</span></td>
                <td>{{ e.capaciteAccueil || '-' }}</td>
                <td>{{ e.telephone || '-' }}</td>
                <td class="actions">
                  <a [routerLink]="['/etablissements', e.id]" class="action-btn" [title]="'COMMON.VIEW' | translate">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a [routerLink]="['/etablissements', e.id, 'edit']" class="action-btn edit" [title]="'COMMON.EDIT' | translate" *ngIf="canEdit()">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button class="action-btn delete" color="warn" (click)="delete(e)" *ngIf="canDelete()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="8" class="empty-row">{{ 'ETABLISSEMENT.LIST.EMPTY' | translate }}</td>
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
  `,
  styles: [`
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
      align-items: end;
    }

    .table-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .page-size-select {
      padding: 4px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-sm);
    }
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .link:hover { text-decoration: underline; }
    .sub-text { font-size: var(--font-xs); color: var(--color-text-tertiary); direction: rtl; }
    .badge {
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: var(--font-xs);
      font-weight: 500;
    }
    .badge-blue { background: var(--color-primary-surface); color: var(--color-primary-dark); }
    .badge-green { background: var(--color-primary-surface); color: var(--color-primary-dark); }
    .badge-orange { background: var(--color-accent-surface); color: var(--color-accent); }
    .actions { display: flex; gap: 4px; }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px; height: 32px;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: transparent;
      color: var(--color-text-secondary);
      text-decoration: none;
    }
    .action-btn:hover { background: var(--color-surface-2); }
    .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
    .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-row { text-align: center; padding: 40px; color: var(--color-text-tertiary); }
    .pagination {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: var(--space-4);
    }
    .page-btn {
      padding: 6px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-white);
      cursor: pointer;
      font-size: var(--font-sm);
    }
    .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
    .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
  `]
})
export class EtablissementsListComponent implements OnInit {
  all: EtablissementCentre[] = [];
  filtered: EtablissementCentre[] = [];
  paginated: EtablissementCentre[] = [];
  provinces: Province[] = [];
  loading = true;
  pageSize = 10;
  pageIndex = 0;

  filters = {
    nom: '',
    provinceId: null as number | null,
    typeLocal: null as string | null,
    milieu: null as string | null
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.api.getEtablissements().subscribe({
      next: data => {
        this.all = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
    this.api.getProvinces().subscribe({
      next: p => { this.provinces = [...p]; this.cdr.detectChanges(); }
    });
  }

  applyFilters() {
    this.filtered = this.all.filter(e => {
      const nom = !this.filters.nom ||
        e.nomFr.toLowerCase().includes(this.filters.nom.toLowerCase()) ||
        (e.nomAr || '').includes(this.filters.nom);
      const province = !this.filters.provinceId || e.provinceId === this.filters.provinceId;
      const type = !this.filters.typeLocal || e.typeLocal === this.filters.typeLocal;
      const milieu = !this.filters.milieu || e.milieu === this.filters.milieu;
      return nom && province && type && milieu;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilters() {
    this.filters = { nom: '', provinceId: null, typeLocal: null, milieu: null };
    this.applyFilters();
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

  goToPage(index: number) {
    this.pageIndex = index;
    this.updatePage();
  }

  onPageSizeChange() {
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.paginated = this.filtered.slice(start, start + this.pageSize);
  }

  delete(e: EtablissementCentre) {
    if (!confirm(this.translate.instant('ETABLISSEMENT.LIST.CONFIRM_DELETE', { name: e.nomFr }))) return;
    this.api.deleteEtablissement(e.id).subscribe({
      next: () => {
        this.all = this.all.filter(x => x.id !== e.id);
        this.applyFilters();
        this.snackBar.open(this.translate.instant('ETABLISSEMENT.LIST.DELETED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  exportExcel() {
    this.api.exportExcel('etablissements').subscribe(blob => this.download(blob, 'etablissements.xlsx'));
  }

  exportPdf() {
    this.api.exportPdf('etablissements').subscribe(blob => this.download(blob, 'etablissements.pdf'));
  }

  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  formatType(type: string | undefined): string {
    return type ? this.translate.instant('ETABLISSEMENT.TYPES.' + type) : '-';
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
