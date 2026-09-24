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
import { User, CreateUserRequest, Role } from '../../../core/models/user.model';
import { Province, Region } from '../../../core/models/geo.model';
import { EtablissementCentre } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'ADMIN.USERS.TITLE' | translate }}</h1>
      <button class="btn btn-primary" (click)="openForm()">
        <mat-icon>person_add</mat-icon> {{ 'COMMON.ADD' | translate }}
      </button>
    </div>

    <!-- Filters -->
    <mat-card class="mb-2">
      <mat-card-content>
        <div class="filter-grid">
          <div class="field">
            <label>{{ 'ADMIN.USERS.SEARCH_LABEL' | translate }}</label>
            <input type="text" [(ngModel)]="filterNom" (ngModelChange)="applyFilter()" [placeholder]="'ADMIN.USERS.SEARCH_PLACEHOLDER' | translate">
          </div>
          <div class="field">
            <label>{{ 'ADMIN.USERS.ROLE' | translate }}</label>
            <select [(ngModel)]="filterRole" (ngModelChange)="applyFilter()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option *ngFor="let r of roles" [value]="r">{{ getRoleLabel(r) }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'ADMIN.USERS.STATUT' | translate }}</label>
            <select [(ngModel)]="filterActive" (ngModelChange)="applyFilter()">
              <option value="">{{ 'COMMON.ALL' | translate }}</option>
              <option value="true">{{ 'ADMIN.USERS.ACTIVE' | translate }}</option>
              <option value="false">{{ 'ADMIN.USERS.INACTIVE' | translate }}</option>
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
        <mat-card-title>{{ (editingId ? 'ADMIN.USERS.FORM_TITLE_EDIT' : 'ADMIN.USERS.FORM_TITLE_ADD') | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="field">
              <label>{{ 'ADMIN.USERS.NOM_LABEL' | translate }}</label>
              <input type="text" formControlName="nom" [placeholder]="'ADMIN.USERS.NOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">{{ 'ADMIN.USERS.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'ADMIN.USERS.PRENOM_LABEL' | translate }}</label>
              <input type="text" formControlName="prenom" [placeholder]="'ADMIN.USERS.PRENOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('prenom')?.invalid && form.get('prenom')?.touched">{{ 'ADMIN.USERS.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'ADMIN.USERS.EMAIL_LABEL' | translate }}</label>
              <input type="email" formControlName="email" placeholder="email@entraide.ma">
              <span class="err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">{{ 'ADMIN.USERS.EMAIL_INVALID' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'ADMIN.USERS.ROLE_LABEL' | translate }}</label>
              <select formControlName="role" (change)="onRoleChange()">
                <option value="">{{ 'ADMIN.USERS.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let r of roles" [value]="r">{{ getRoleLabel(r) }}</option>
              </select>
              <span class="err" *ngIf="form.get('role')?.invalid && form.get('role')?.touched">{{ 'ADMIN.USERS.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'ADMIN.USERS.REGION' | translate }}</label>
              <select formControlName="regionId" (change)="onRegionChange($event)">
                <option value="">{{ 'ADMIN.USERS.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let r of regions" [value]="r.id">{{ r.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'ADMIN.USERS.PROVINCE' | translate }}</label>
              <select formControlName="provinceId">
                <option value="">{{ 'ADMIN.USERS.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of filteredProvinces" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
            <div class="field" *ngIf="requiresEtablissement()">
              <label>{{ 'ADMIN.USERS.ETABLISSEMENT_LABEL' | translate }}</label>
              <select formControlName="etablissementCentreId">
                <option value="">{{ 'ADMIN.USERS.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
              <span class="err" *ngIf="form.get('etablissementCentreId')?.invalid && form.get('etablissementCentreId')?.touched">{{ 'ADMIN.USERS.REQUIRED' | translate }}</span>
            </div>
          </div>
          <div class="form-info" *ngIf="!editingId">
            <mat-icon>info</mat-icon>
            {{ 'ADMIN.USERS.ACTIVATION_INFO' | translate }}
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              <mat-spinner diameter="16" *ngIf="saving" style="display:inline-block;margin-right:6px"></mat-spinner>
              {{ saving ? '' : ((editingId ? 'COMMON.SAVE' : 'ADMIN.USERS.CREATE_AND_SEND') | translate) }}
            </button>
          </div>
        </form>
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
          <span class="text-secondary">{{ filtered.length }} {{ 'ADMIN.USERS.COUNT_SUFFIX' | translate }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'ADMIN.USERS.COL_UTILISATEUR' | translate }}</th>
                <th>{{ 'ADMIN.USERS.EMAIL' | translate }}</th>
                <th>{{ 'ADMIN.USERS.ROLE' | translate }}</th>
                <th>{{ 'ADMIN.USERS.PROVINCE' | translate }}</th>
                <th>{{ 'ADMIN.USERS.STATUT' | translate }}</th>
                <th>{{ 'ADMIN.USERS.COL_CREATED_AT' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of paginated">
                <td>
                  <div class="person-cell">
                    <div class="avatar" [style.background]="getAvatarColor(u)">
                      {{ u.nom.charAt(0) }}{{ u.prenom.charAt(0) }}
                    </div>
                    <div>
                      <strong>{{ u.nom }} {{ u.prenom }}</strong>
                    </div>
                  </div>
                </td>
                <td>{{ u.email }}</td>
                <td><span class="badge badge-blue">{{ getRoleLabel(u.role) }}</span></td>
                <td>{{ u.etablissementCentreNom || u.provinceNom || u.regionNom || '-' }}</td>
                <td>
                  <span class="badge" [class.badge-green]="u.active" [class.badge-red]="!u.active">
                    {{ (u.active ? 'ADMIN.USERS.ACTIVE' : 'ADMIN.USERS.INACTIVE') | translate }}
                  </span>
                </td>
                <td>{{ u.createdAt ? (u.createdAt | date:'dd/MM/yyyy') : '-' }}</td>
                <td class="actions">
                  <button class="action-btn edit" (click)="openEditForm(u)" [title]="'COMMON.EDIT' | translate">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="action-btn" (click)="resendEmail(u)" [title]="'ADMIN.USERS.RESEND_EMAIL_TITLE' | translate" *ngIf="!u.active">
                    <mat-icon>email</mat-icon>
                  </button>
                  <button class="action-btn delete" (click)="deleteUser(u)" [title]="'COMMON.DELETE' | translate">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="paginated.length === 0">
                <td colspan="7" class="empty-row">{{ 'ADMIN.USERS.EMPTY' | translate }}</td>
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
    .form-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .form-info {
      display: flex; align-items: center; gap: 8px;
      background: #e3f2fd; color: #1565c0; padding: 10px 14px;
      border-radius: 6px; font-size: 13px; margin-bottom: 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
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
      padding: 12px 14px; text-align: left; font-size: 13px; font-weight: 600;
    }
    .data-table td { padding: 11px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9f9; }
    .person-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 600; flex-shrink: 0;
    }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .badge-red { background: #ffebee; color: #c62828; }
    .actions { display: flex; gap: 4px; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; background: transparent; color: #666;
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
export class UsersComponent implements OnInit {
  all: User[] = [];
  filtered: User[] = [];
  paginated: User[] = [];
  regions: Region[] = [];
  filteredProvinces: Province[] = [];
  etablissements: EtablissementCentre[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editingId: string | null = null;
  pageSize = 10;
  pageIndex = 0;
  filterNom = '';
  filterRole = '';
  filterActive = '';
  form!: FormGroup;

  readonly roles: Role[] = [
    'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
    'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE',
    'ROLE_RESPONSABLE_ALERTE', 'ROLE_RESPONSABLE_SIGNALEMENT',
    'ROLE_ASSISTANTE_SOCIALE', 'ROLE_COORDINATION'
  ];

  readonly avatarColors = ['#2e7d32','#1565c0','#6a1b9a','#e65100','#00838f','#558b2f'];

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
    this.api.getUsers().subscribe({
      next: d => { this.all = d; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => this.loading = false
    });
    this.api.getRegions().subscribe({
      next: r => { this.regions = [...r]; this.cdr.detectChanges(); }
    });
    this.api.getEtablissements().subscribe({
      next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      regionId: [''],
      provinceId: [''],
      etablissementCentreId: ['']
    });
  }

  requiresEtablissement(): boolean {
    return ['ROLE_DIRECTEUR_CENTRALE', 'ROLE_ASSISTANTE_SOCIALE'].includes(this.form.get('role')?.value);
  }

  onRoleChange() {
    const control = this.form.get('etablissementCentreId');
    if (this.requiresEtablissement()) {
      control?.setValidators([Validators.required]);
    } else {
      control?.clearValidators();
      control?.setValue('');
    }
    control?.updateValueAndValidity();
  }

  openForm() { this.showForm = true; this.editingId = null; this.form.reset(); this.filteredProvinces = []; }

  openEditForm(u: User) {
    this.editingId = u.id;
    this.showForm = true;
    this.form.patchValue(u);
    if (u.regionId) this.onRegionChange({ target: { value: u.regionId } });
    this.onRoleChange();
  }

  closeForm() { this.showForm = false; this.editingId = null; this.form.reset(); this.filteredProvinces = []; }

  onRegionChange(event: any) {
    const regionId = event.target?.value || event;
    if (!regionId) { this.filteredProvinces = []; return; }
    this.api.getProvincesByRegion(+regionId).subscribe({
      next: p => { this.filteredProvinces = [...p]; this.cdr.detectChanges(); }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const data: CreateUserRequest = this.form.value;
    const req = this.editingId
      ? this.api.updateUser(this.editingId, data)
      : this.api.createUser(data);

    req.subscribe({
      next: u => {
        if (this.editingId) {
          this.all = this.all.map(x => x.id === u.id ? u : x);
        } else {
          this.all.unshift(u);
          this.snackBar.open(this.translate.instant('ADMIN.USERS.CREATED'), 'OK', { duration: 4000, panelClass: 'success-snackbar' });
        }
        this.applyFilter();
        this.saving = false;
        this.closeForm();
        if (this.editingId) this.snackBar.open(this.translate.instant('ADMIN.USERS.UPDATED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  deleteUser(u: User) {
    if (!confirm(this.translate.instant('ADMIN.USERS.CONFIRM_DELETE', { name: `${u.nom} ${u.prenom}` }))) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => {
        this.all = this.all.filter(x => x.id !== u.id);
        this.applyFilter();
        this.snackBar.open(this.translate.instant('ADMIN.USERS.DELETED'), 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  resendEmail(u: User) {
    this.api.resendActivation(u.id).subscribe({
      next: () => this.snackBar.open(this.translate.instant('ADMIN.USERS.EMAIL_RESENT'), 'OK', { duration: 3000, panelClass: 'success-snackbar' }),
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  applyFilter() {
    this.filtered = this.all.filter(u => {
      const nom = !this.filterNom ||
        `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(this.filterNom.toLowerCase());
      const role = !this.filterRole || u.role === this.filterRole;
      const active = !this.filterActive || String(u.active) === this.filterActive;
      return nom && role && active;
    });
    this.pageIndex = 0;
    this.updatePage();
  }

  resetFilter() { this.filterNom = ''; this.filterRole = ''; this.filterActive = ''; this.applyFilter(); }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers() {
    const pages = []; const s = Math.max(0, this.pageIndex - 2); const e = Math.min(this.totalPages - 1, this.pageIndex + 2);
    for (let i = s; i <= e; i++) pages.push(i); return pages;
  }
  goToPage(i: number) { this.pageIndex = i; this.updatePage(); }
  updatePage() { const s = this.pageIndex * this.pageSize; this.paginated = this.filtered.slice(s, s + this.pageSize); }

  getRoleLabel(role: string): string {
    return role ? this.translate.instant('ADMIN.USERS.ROLES.' + role) : role;
  }

  getAvatarColor(u: User): string {
    const idx = (u.nom.charCodeAt(0) + u.prenom.charCodeAt(0)) % this.avatarColors.length;
    return this.avatarColors[idx];
  }
}
