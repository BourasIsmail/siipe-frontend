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
import { Personnel } from '../../../core/models/personnel.model';
import { EtablissementCentre } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-personnel-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'PERSONNEL.LIST.TITLE' | translate }}</h1>
      <div class="flex gap-2">
        <button class="btn btn-excel" (click)="exportExcel()">
          <mat-icon>table_view</mat-icon> {{ 'COMMON.EXPORT_EXCEL' | translate }}
        </button>
        <button class="btn btn-pdf" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon> {{ 'COMMON.EXPORT_PDF' | translate }}
        </button>
        <a class="btn btn-primary" routerLink="/personnel/add" *ngIf="canEdit()">
          <mat-icon>person_add</mat-icon> {{ 'COMMON.ADD' | translate }}
        </a>
      </div>
    </div>

    <!-- Filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'PERSONNEL.LIST.NOM_PRENOM' | translate }}</label>
            <input type="text" [(ngModel)]="filters.nom" (ngModelChange)="applyFilters()" [placeholder]="'PERSONNEL.LIST.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'PERSONNEL.MATRICULE' | translate }}</label>
            <input type="text" [(ngModel)]="filters.matricule" (ngModelChange)="applyFilters()" [placeholder]="'PERSONNEL.LIST.MATRICULE_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'PERSONNEL.ETABLISSEMENT' | translate }}</label>
            <select [(ngModel)]="filters.etablissementId" (ngModelChange)="applyFilters()">
              <option [ngValue]="null">{{ 'COMMON.ALL' | translate }}</option>
              <option *ngFor="let e of etablissements" [ngValue]="e.id">{{ e.nomFr }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'PERSONNEL.GRADE' | translate }}</label>
            <select [(ngModel)]="filters.grade" (ngModelChange)="applyFilters()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="ADMINISTRATEUR_1ER_GRADE">{{ 'PERSONNEL.LIST.GRADES.ADMINISTRATEUR_1ER_GRADE' | translate }}</option>
              <option value="ADMINISTRATEUR_2EME_GRADE">{{ 'PERSONNEL.LIST.GRADES.ADMINISTRATEUR_2EME_GRADE' | translate }}</option>
              <option value="ADMINISTRATEUR_3EME_GRADE">{{ 'PERSONNEL.LIST.GRADES.ADMINISTRATEUR_3EME_GRADE' | translate }}</option>
              <option value="REDACTEUR_1ER_GRADE">{{ 'PERSONNEL.LIST.GRADES.REDACTEUR_1ER_GRADE' | translate }}</option>
              <option value="REDACTEUR_2EME_GRADE">{{ 'PERSONNEL.LIST.GRADES.REDACTEUR_2EME_GRADE' | translate }}</option>
              <option value="REDACTEUR_3EME_GRADE">{{ 'PERSONNEL.LIST.GRADES.REDACTEUR_3EME_GRADE' | translate }}</option>
              <option value="TECHNICIEN_PREMIER_GRADE">{{ 'PERSONNEL.LIST.GRADES.TECHNICIEN_PREMIER_GRADE' | translate }}</option>
              <option value="TECHNICIEN_DEUXIEME_GRADE">{{ 'PERSONNEL.LIST.GRADES.TECHNICIEN_DEUXIEME_GRADE' | translate }}</option>
              <option value="TECHNICIEN_TROISIEME_GRADE">{{ 'PERSONNEL.LIST.GRADES.TECHNICIEN_TROISIEME_GRADE' | translate }}</option>
              <option value="ADJOINT_ADMINISTRATIF_1ER_GRADE">{{ 'PERSONNEL.LIST.GRADES.ADJOINT_ADMINISTRATIF_1ER_GRADE' | translate }}</option>
              <option value="ADJOINT_TECHNIQUE_1ER_GRADE">{{ 'PERSONNEL.LIST.GRADES.ADJOINT_TECHNIQUE_1ER_GRADE' | translate }}</option>
              <option value="AGENTS_A_CONTRAT">{{ 'PERSONNEL.LIST.GRADES.AGENTS_A_CONTRAT' | translate }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'PERSONNEL.FONCTION' | translate }}</label>
            <select [(ngModel)]="filters.fonction" (ngModelChange)="applyFilters()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="DIRECTEUR">{{ 'PERSONNEL.LIST.FONCTIONS.DIRECTEUR' | translate }}</option>
              <option value="DIRECTEUR_DU_CENTRE">{{ 'PERSONNEL.LIST.FONCTIONS.DIRECTEUR_DU_CENTRE' | translate }}</option>
              <option value="DIRECTEUR_PROVINCIAL">{{ 'PERSONNEL.LIST.FONCTIONS.DIRECTEUR_PROVINCIAL' | translate }}</option>
              <option value="DIRECTEUR_REGIONAL">{{ 'PERSONNEL.LIST.FONCTIONS.DIRECTEUR_REGIONAL' | translate }}</option>
              <option value="CHEF_DE_SERVICE">{{ 'PERSONNEL.LIST.FONCTIONS.CHEF_DE_SERVICE' | translate }}</option>
              <option value="CHEF_DE_DIVISION">{{ 'PERSONNEL.LIST.FONCTIONS.CHEF_DE_DIVISION' | translate }}</option>
              <option value="SOUS_DIRECTEUR">{{ 'PERSONNEL.LIST.FONCTIONS.SOUS_DIRECTEUR' | translate }}</option>
              <option value="ASSISTANT_SOCIAL">{{ 'PERSONNEL.LIST.FONCTIONS.ASSISTANT_SOCIAL' | translate }}</option>
              <option value="MEDECIN">{{ 'PERSONNEL.LIST.FONCTIONS.MEDECIN' | translate }}</option>
              <option value="INFIRMIER">{{ 'PERSONNEL.LIST.FONCTIONS.INFIRMIER' | translate }}</option>
              <option value="PSYCHOLOGUE">{{ 'PERSONNEL.LIST.FONCTIONS.PSYCHOLOGUE' | translate }}</option>
              <option value="EDUCATEUR">{{ 'PERSONNEL.LIST.FONCTIONS.EDUCATEUR' | translate }}</option>
              <option value="FORMATEUR">{{ 'PERSONNEL.LIST.FONCTIONS.FORMATEUR' | translate }}</option>
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
          <span class="text-secondary">{{ filtered.length }} {{ 'PERSONNEL.LIST.AGENTS_COUNT' | translate }}</span>
          <div class="pagination-controls">
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="page-size-select">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-secondary">{{ 'PERSONNEL.LIST.PER_PAGE' | translate }}</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'PERSONNEL.LIST.NOM_PRENOM' | translate }}</th>
                <th>{{ 'PERSONNEL.MATRICULE' | translate }}</th>
                <th>{{ 'PERSONNEL.LIST.SEXE' | translate }}</th>
                <th>{{ 'PERSONNEL.GRADE' | translate }}</th>
                <th>{{ 'PERSONNEL.FONCTION' | translate }}</th>
                <th>{{ 'PERSONNEL.ETABLISSEMENT' | translate }}</th>
                <th>{{ 'PERSONNEL.DATE_RECRUTEMENT' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of paginated">
                <td>
                  <div class="person-cell">
                    <div class="avatar" [style.background]="getAvatarColor(p)">
                      {{ p.nom.charAt(0) }}{{ p.prenom.charAt(0) }}
                    </div>
                    <div>
                      <a [routerLink]="['/personnel', p.id]" class="link">{{ p.nom }} {{ p.prenom }}</a>
                      <div class="sub-text">{{ p.email || '' }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ p.matricule }}</span></td>
                <td>{{ p.sexe === 'MASCULIN' ? 'M' : p.sexe === 'FEMININ' ? 'F' : '-' }}</td>
                <td>{{ formatEnum(p.grade, 'GRADES') }}</td>
                <td>{{ formatEnum(p.fonction, 'FONCTIONS') }}</td>
                <td>{{ p.etablissementCentreNom || '-' }}</td>
                <td>{{ p.dateRecrutement ? (p.dateRecrutement | date:'dd/MM/yyyy') : '-' }}</td>
                <td class="actions">
                  <a [routerLink]="['/personnel', p.id]" class="action-btn" [title]="'COMMON.VIEW' | translate">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a [routerLink]="['/personnel', p.id, 'evaluation']" class="action-btn" [title]="'PERSONNEL.LIST.EVALUATION_TOOLTIP' | translate" style="color:#1565c0">
                    <mat-icon>assignment</mat-icon>
                  </a>
                  <a [routerLink]="['/personnel', p.id, 'edit']" class="action-btn edit" [title]="'COMMON.EDIT' | translate" *ngIf="canEdit()">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button class="action-btn delete" (click)="delete(p)" [title]="'COMMON.DELETE' | translate" *ngIf="isAdmin()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="8" class="empty-row">{{ 'PERSONNEL.LIST.EMPTY' | translate }}</td>
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
      gap: 16px; align-items: end;
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
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer;
      font-weight: 500; text-decoration: none;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-primary:hover { background: var(--color-primary-dark); }
    .btn-excel { background: #1e7e34; color: white; }
    .btn-pdf { background: #c62828; color: white; }
    .btn-outline { background: white; color: #666; border: 1px solid #ccc; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .table-meta {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 12px;
    }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-size-select {
      padding: 4px 8px; border: 1px solid #ccc;
      border-radius: 4px; font-size: 13px;
    }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th {
      background: var(--color-primary); color: white;
      padding: 12px 14px; text-align: start; font-size: 13px;
      font-weight: 600; white-space: nowrap;
    }
    .data-table td {
      padding: 11px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle;
    }
    .data-table tr:hover td { background: #f9f9f9; }
    .person-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 600; flex-shrink: 0;
    }
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .sub-text { font-size: 12px; color: #999; }
    .badge {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
    }
    .badge-gray { background: #f5f5f5; color: #555; }
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
  `]
})
export class PersonnelListComponent implements OnInit {
  all: Personnel[] = [];
  filtered: Personnel[] = [];
  paginated: Personnel[] = [];
  etablissements: EtablissementCentre[] = [];
  loading = true;
  pageSize = 10;
  pageIndex = 0;

  filters = {
    nom: '',
    matricule: '',
    etablissementId: null as number | null,
    grade: '',
    fonction: ''
  };

  readonly avatarColors = ['#2e7d32','#1565c0','#6a1b9a','#e65100','#00838f','#558b2f','#4527a0'];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.api.getPersonnel().subscribe({
      next: data => {
        this.all = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
    this.api.getEtablissements().subscribe({
      next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); }
    });
  }

  applyFilters() {
    this.filtered = this.all.filter(p => {
      const nom = !this.filters.nom ||
        `${p.nom} ${p.prenom}`.toLowerCase().includes(this.filters.nom.toLowerCase());
      const matricule = !this.filters.matricule ||
        p.matricule.toLowerCase().includes(this.filters.matricule.toLowerCase());
      const etab = !this.filters.etablissementId ||
        p.etablissementCentreId === this.filters.etablissementId;
      const grade = !this.filters.grade || p.grade === this.filters.grade;
      const fonction = !this.filters.fonction || p.fonction === this.filters.fonction;
      return nom && matricule && etab && grade && fonction;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilters() {
    this.filters = { nom: '', matricule: '', etablissementId: null, grade: '', fonction: '' };
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

  goToPage(index: number) { this.pageIndex = index; this.updatePage(); }
  onPageSizeChange() { this.pageIndex = 0; this.updatePage(); }
  updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.paginated = this.filtered.slice(start, start + this.pageSize);
  }

  delete(p: Personnel) {
    if (!confirm(this.translate.instant('PERSONNEL.LIST.CONFIRM_DELETE', { name: `${p.nom} ${p.prenom}` }))) return;
    this.api.deletePersonnel(p.id).subscribe({
      next: () => {
        this.all = this.all.filter(x => x.id !== p.id);
        this.applyFilters();
        this.snackBar.open(this.translate.instant('PERSONNEL.LIST.DELETED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  exportExcel() {
    this.api.exportExcel('personnel').subscribe(blob => this.download(blob, 'personnel.xlsx'));
  }

  exportPdf() {
    this.api.exportPdf('personnel').subscribe(blob => this.download(blob, 'personnel.pdf'));
  }

  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  getAvatarColor(p: Personnel): string {
    const index = (p.nom.charCodeAt(0) + p.prenom.charCodeAt(0)) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  formatEnum(val: string | undefined, group: string): string {
    if (!val) return '-';
    const key = 'PERSONNEL.LIST.' + group + '.' + val;
    const translated = this.translate.instant(key);
    if (translated !== key) return translated;
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  isAdmin() { return this.auth.isAdmin(); }
  canEdit() { return this.auth.canEditPersonnel(); }
}
