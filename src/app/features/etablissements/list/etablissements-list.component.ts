import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>Établissements / Centres</h1>
      <div class="flex gap-2">
        <button class="btn btn-excel" (click)="exportExcel()">
          <mat-icon>table_view</mat-icon> Excel
        </button>
        <button class="btn btn-pdf" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon> PDF
        </button>
        <button class="btn btn-primary" routerLink="/etablissements/add" *ngIf="canEdit()">
          <mat-icon>add</mat-icon> Ajouter
        </button>
      </div>
    </div>

    <!-- Search filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>Nom</label>
            <input type="text" [(ngModel)]="filters.nom" (ngModelChange)="applyFilters()" placeholder="Rechercher par nom...">
          </div>
          <div class="field">
            <label>Province</label>
            <select [(ngModel)]="filters.provinceId" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">Toutes</option>
              <option *ngFor="let p of provinces" [ngValue]="p.id">{{ p.nomFr }}</option>
            </select>
          </div>
          <div class="field">
            <label>Type de local</label>
            <select [(ngModel)]="filters.typeLocal" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">Tous</option>
              <option value="CENTRE_SOCIALE">Centre sociale</option>
              <option value="DELEGATION">Délégation</option>
              <option value="COORDINATION">Coordination</option>
              <option value="DEPOT">Dépôt</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div class="field">
            <label>Milieu</label>
            <select [(ngModel)]="filters.milieu" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">Tous</option>
              <option value="URBAIN">Urbain</option>
              <option value="RURAL">Rural</option>
            </select>
          </div>
          <div class="field" style="justify-content:flex-end;padding-top:20px">
            <button class="btn btn-outline" (click)="resetFilters()">
              <mat-icon>clear</mat-icon> Réinitialiser
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
          <span class="text-secondary">{{ filtered.length }} résultat(s)</span>
          <div class="pagination-controls">
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="page-size-select">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-secondary">par page</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Province</th>
                <th>Type</th>
                <th>Milieu</th>
                <th>Capacité</th>
                <th>Téléphone</th>
                <th>Actions</th>
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
                <td><span class="badge" [class.badge-green]="e.milieu === 'URBAIN'" [class.badge-orange]="e.milieu === 'RURAL'">{{ e.milieu || '-' }}</span></td>
                <td>{{ e.capaciteAccueil || '-' }}</td>
                <td>{{ e.telephone || '-' }}</td>
                <td class="actions">
                  <a [routerLink]="['/etablissements', e.id]" class="action-btn" title="Voir">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a [routerLink]="['/etablissements', e.id, 'edit']" class="action-btn edit" title="Modifier" *ngIf="canEdit()">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button class="action-btn delete" color="warn" (click)="delete(e)" *ngIf="canDelete()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="8" class="empty-row">Aucun établissement trouvé</td>
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
      gap: 16px;
      align-items: end;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
    }
    .field input,
    .field select {
      padding: 9px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      background: white;
      color: #333;
      height: 40px;
    }
    .field input:focus,
    .field select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(46,125,50,0.12);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      font-weight: 500;
      text-decoration: none;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-primary:hover { background: var(--color-primary-dark); }
    .btn-excel { background: #1e7e34; color: white; }
    .btn-pdf { background: #c62828; color: white; }
    .btn-outline { background: white; color: #666; border: 1px solid #ccc; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .table-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-size-select {
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
    }
    .table-wrap { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .data-table th {
      background: var(--color-primary);
      color: white;
      padding: 12px 14px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      white-space: nowrap;
    }
    .data-table td {
      padding: 11px 14px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }
    .data-table tr:hover td { background: #f9f9f9; }
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .link:hover { text-decoration: underline; }
    .sub-text { font-size: 12px; color: #999; direction: rtl; }
    .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .badge-orange { background: #fff3e0; color: #e65100; }
    .actions { display: flex; gap: 4px; }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px; height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: transparent;
      color: #666;
      text-decoration: none;
    }
    .action-btn:hover { background: #f0f0f0; }
    .action-btn.edit:hover { color: var(--color-primary); background: #e8f5e9; }
    .action-btn.delete:hover { color: #c62828; background: #ffebee; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-row { text-align: center; padding: 40px; color: #999; }
    .pagination {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: 16px;
    }
    .page-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 13px;
    }
    .page-btn:hover:not(:disabled) { background: #f0f0f0; }
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
    private cdr: ChangeDetectorRef
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
    if (!confirm(`Supprimer "${e.nomFr}" ?`)) return;
    this.api.deleteEtablissement(e.id).subscribe({
      next: () => {
        this.all = this.all.filter(x => x.id !== e.id);
        this.applyFilters();
        this.snackBar.open('Supprimé', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' })
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
    const map: Record<string, string> = {
      CENTRE_SOCIALE: 'Centre sociale', DELEGATION: 'Délégation',
      COORDINATION: 'Coordination', DEPOT: 'Dépôt', AUTRE: 'Autre'
    };
    return type ? (map[type] || type) : '-';
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
