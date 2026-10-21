import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Programme, Prestation } from '../../core/models/etablissement.model';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'PROGRAMME.TITLE' | translate }}</h1>
      <button class="btn btn-primary" (click)="openProgrammeForm()">
        <mat-icon>add</mat-icon> {{ 'PROGRAMME.NEW' | translate }}
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- Programme Form -->
    <mat-card class="mb-2" *ngIf="showProgrammeForm">
      <mat-card-header>
        <mat-card-title>{{ (editingProgrammeId ? 'PROGRAMME.FORM_TITLE_EDIT' : 'PROGRAMME.NEW') | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="programmeForm" (ngSubmit)="onSubmitProgramme()">
          <div class="form-row">
            <div class="field">
              <label>{{ 'PROGRAMME.NOM_FR_LABEL' | translate }}</label>
              <input type="text" formControlName="nomFr" [placeholder]="'PROGRAMME.NOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="programmeForm.get('nomFr')?.invalid && programmeForm.get('nomFr')?.touched">{{ 'PROGRAMME.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PROGRAMME.NOM_AR_LABEL' | translate }}</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="اسم البرنامج">
              <span class="err" *ngIf="programmeForm.get('nomAr')?.invalid && programmeForm.get('nomAr')?.touched">{{ 'PROGRAMME.REQUIRED' | translate }}</span>
            </div>
          </div>
          <div class="field mb-2">
            <label>{{ 'PROGRAMME.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" rows="2" [placeholder]="'PROGRAMME.DESCRIPTION_PLACEHOLDER' | translate"></textarea>
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeProgrammeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="programmeForm.invalid || savingProgramme">
              <mat-spinner diameter="16" *ngIf="savingProgramme" style="display:inline-block;margin-inline-end:6px"></mat-spinner>
              {{ savingProgramme ? '' : ((editingProgrammeId ? 'COMMON.SAVE' : 'PROGRAMME.CREATE') | translate) }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Programmes list -->
    <div class="programmes-grid" *ngIf="!loading">
      <mat-card class="programme-card" *ngFor="let p of programmes">
        <mat-card-content>
          <div class="programme-header">
            <div>
              <h3>{{ p.nomFr }}</h3>
              <div class="nomAr">{{ p.nomAr }}</div>
              <div class="description text-secondary" *ngIf="p.description">{{ p.description }}</div>
            </div>
            <div class="programme-actions">
              <button class="action-btn edit" (click)="openEditProgramme(p)" [title]="'COMMON.EDIT' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="action-btn delete" (click)="deleteProgramme(p)" [title]="'COMMON.DELETE' | translate">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <!-- Prestations section -->
          <div class="prestations-section">
            <div class="prestations-header">
              <span class="chip">{{ getPrestations(p.id).length }} {{ 'PROGRAMME.PRESTATIONS_COUNT_SUFFIX' | translate }}</span>
              <button class="btn-add-prest" (click)="openPrestationForm(p.id)">
                <mat-icon>add</mat-icon> {{ 'PROGRAMME.ADD_PRESTATION' | translate }}
              </button>
            </div>

            <!-- Prestation add form -->
            <div class="prestation-form" *ngIf="addingPrestationForProgramme === p.id">
              <form [formGroup]="prestationForm" (ngSubmit)="onSubmitPrestation(p.id)">
                <div class="form-row-sm">
                  <div class="field">
                    <label>{{ 'PROGRAMME.NOM_FR_LABEL' | translate }}</label>
                    <input type="text" formControlName="nomFr" [placeholder]="'PROGRAMME.PRESTATION_NOM_PLACEHOLDER' | translate">
                    <span class="err" *ngIf="prestationForm.get('nomFr')?.invalid && prestationForm.get('nomFr')?.touched">{{ 'PROGRAMME.REQUIRED' | translate }}</span>
                  </div>
                  <div class="field">
                    <label>{{ 'PROGRAMME.NOM_AR_LABEL' | translate }}</label>
                    <input type="text" formControlName="nomAr" dir="rtl" placeholder="اسم الخدمة">
                    <span class="err" *ngIf="prestationForm.get('nomAr')?.invalid && prestationForm.get('nomAr')?.touched">{{ 'PROGRAMME.REQUIRED' | translate }}</span>
                  </div>
                  <div class="field">
                    <label>{{ 'PROGRAMME.DESCRIPTION' | translate }}</label>
                    <input type="text" formControlName="description" [placeholder]="'PROGRAMME.PRESTATION_DESCRIPTION_PLACEHOLDER' | translate">
                  </div>
                </div>
                <div class="form-btns-sm">
                  <button type="button" class="btn btn-ghost" (click)="closePrestationForm()">{{ 'COMMON.CANCEL' | translate }}</button>
                  <button type="submit" class="btn btn-primary" [disabled]="prestationForm.invalid || savingPrestation">
                    {{ (savingPrestation ? 'PROGRAMME.SAVING' : 'PROGRAMME.CREATE_PRESTATION') | translate }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Prestations list -->
            <div class="prestations-list">
              <div class="prestation-item" *ngFor="let pr of getPrestations(p.id)">
                <div class="prestation-info">
                  <mat-icon class="prest-icon">check_circle</mat-icon>
                  <div>
                    <span class="prestation-nom">{{ pr.nomFr }}</span>
                    <span class="prestation-nom-ar" *ngIf="pr.nomAr"> — {{ pr.nomAr }}</span>
                    <div class="text-secondary" style="font-size:12px" *ngIf="pr.description">{{ pr.description }}</div>
                  </div>
                </div>
                <button class="action-btn-sm delete" (click)="deletePrestation(pr, p.id)" [title]="'COMMON.DELETE' | translate">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="empty-prestations" *ngIf="getPrestations(p.id).length === 0">
                <mat-icon>info_outline</mat-icon>
                {{ 'PROGRAMME.EMPTY_PRESTATIONS' | translate }}
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="empty-state" *ngIf="programmes.length === 0">
        <mat-icon>category</mat-icon>
        <p>{{ 'PROGRAMME.EMPTY' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .programmes-grid { display: flex; flex-direction: column; gap: var(--space-4); }
    .programme-card { border-inline-start: 4px solid var(--color-primary) !important; }
    .programme-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
    }
    .programme-header h3 { font-size: var(--font-md); color: var(--color-primary); margin-bottom: 4px; }
    .nomAr { font-size: var(--font-base); color: var(--color-text-tertiary); direction: rtl; margin-bottom: 4px; }
    .description { font-size: var(--font-sm); margin-top: 4px; }
    .programme-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: var(--radius-sm);
      cursor: pointer; background: transparent; color: var(--color-text-secondary);
    }
    .action-btn.edit:hover { color: var(--color-primary); background: var(--color-primary-surface); }
    .action-btn.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .prestations-section {
      background: var(--color-surface-2); border-radius: var(--radius-md); padding: 14px;
    }
    .prestations-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    }
    .btn-add-prest {
      display: inline-flex; align-items: center; gap: 4px;
      background: none; border: 1px dashed var(--color-primary); color: var(--color-primary);
      padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-sm); font-family: inherit;
    }
    .btn-add-prest:hover { background: var(--color-primary-surface); }
    .btn-add-prest mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .prestation-form {
      background: var(--color-white); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;
      border: 1px solid var(--color-primary-surface);
    }
    .form-row-sm {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
      gap: 12px; margin-bottom: 12px;
    }
    .mb-2 { margin-bottom: 12px; }
    .form-btns-sm { display: flex; justify-content: flex-end; gap: var(--space-2); }
    .prestations-list { display: flex; flex-direction: column; gap: 8px; }
    .prestation-item {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--color-white); border-radius: var(--radius-md); padding: 10px 14px;
      border: 1px solid var(--color-border);
    }
    .prestation-info { display: flex; align-items: center; gap: 10px; flex: 1; }
    .prest-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }
    .prestation-nom { font-size: var(--font-base); font-weight: 500; color: var(--color-text); }
    .prestation-nom-ar { font-size: var(--font-sm); color: var(--color-text-tertiary); }
    .action-btn-sm {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border: none; border-radius: 4px;
      cursor: pointer; background: transparent; color: var(--color-text-tertiary); flex-shrink: 0;
    }
    .action-btn-sm.delete:hover { color: var(--color-danger); background: var(--color-danger-surface); }
    .action-btn-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-prestations {
      display: flex; align-items: center; gap: 6px;
      font-size: var(--font-sm); color: var(--color-text-tertiary); padding: 8px; justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .err { color: var(--color-danger); font-size: var(--font-xs); }
    .empty-state {
      text-align: center; padding: 60px; color: var(--color-text-tertiary); background: var(--color-white);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; }
    .empty-state p { font-size: var(--font-md); }
  `]
})
export class ProgrammesComponent implements OnInit {
  programmes: Programme[] = [];
  prestationsMap: Map<number, Prestation[]> = new Map();
  loading = true;
  showProgrammeForm = false;
  savingProgramme = false;
  savingPrestation = false;
  editingProgrammeId: number | null = null;
  addingPrestationForProgramme: number | null = null;
  programmeForm!: FormGroup;
  prestationForm!: FormGroup;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.buildForms();
    this.loadProgrammes();
  }

  buildForms() {
    this.programmeForm = this.fb.group({
      nomFr: ['', Validators.required],
      nomAr: ['', Validators.required],
      description: ['']
    });
    this.prestationForm = this.fb.group({
      nomFr: ['', Validators.required],
      nomAr: ['', Validators.required],
      description: ['']
    });
  }

  loadProgrammes() {
    this.loading = true;
    this.api.getProgrammes().subscribe({
      next: programmes => {
        this.programmes = programmes;
        this.prestationsMap = new Map();
        let loaded = 0;
        if (programmes.length === 0) { this.loading = false; this.cdr.detectChanges(); return; }
        programmes.forEach(p => {
          this.api.getPrestationsByProgramme(p.id).subscribe({
            next: pr => {
              this.prestationsMap.set(p.id, pr);
              this.prestationsMap = new Map(this.prestationsMap);
              loaded++;
              if (loaded === programmes.length) { this.loading = false; }
              this.cdr.detectChanges();
            },
            error: () => {
              this.prestationsMap.set(p.id, []);
              loaded++;
              if (loaded === programmes.length) { this.loading = false; }
              this.cdr.detectChanges();
            }
          });
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getPrestations(programmeId: number): Prestation[] {
    return this.prestationsMap.get(programmeId) || [];
  }

  openProgrammeForm() {
    this.showProgrammeForm = true;
    this.editingProgrammeId = null;
    this.programmeForm.reset();
  }

  openEditProgramme(p: Programme) {
    this.editingProgrammeId = p.id;
    this.showProgrammeForm = true;
    this.programmeForm.patchValue(p);
  }

  closeProgrammeForm() {
    this.showProgrammeForm = false;
    this.editingProgrammeId = null;
    this.programmeForm.reset();
  }

  onSubmitProgramme() {
    if (this.programmeForm.invalid) return;
    this.savingProgramme = true;
    const req = this.editingProgrammeId
      ? this.api.updateProgramme(this.editingProgrammeId, this.programmeForm.value)
      : this.api.createProgramme(this.programmeForm.value);

    req.subscribe({
      next: p => {
        if (this.editingProgrammeId) {
          this.programmes = this.programmes.map(x => x.id === p.id ? p : x);
        } else {
          this.programmes = [...this.programmes, p];
          this.prestationsMap.set(p.id, []);
          this.prestationsMap = new Map(this.prestationsMap);
        }
        this.savingProgramme = false;
        this.closeProgrammeForm();
        this.snackBar.open(
          this.editingProgrammeId ? this.translate.instant('PROGRAMME.UPDATED') : this.translate.instant('PROGRAMME.CREATED'),
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingProgramme = false;
        this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  deleteProgramme(p: Programme) {
    if (!confirm(this.translate.instant('PROGRAMME.CONFIRM_DELETE', { name: p.nomFr }))) return;
    this.api.deleteProgramme(p.id).subscribe({
      next: () => {
        this.programmes = this.programmes.filter(x => x.id !== p.id);
        this.prestationsMap.delete(p.id);
        this.prestationsMap = new Map(this.prestationsMap);
        this.snackBar.open(this.translate.instant('PROGRAMME.DELETED'), 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  openPrestationForm(programmeId: number) {
    this.addingPrestationForProgramme = programmeId;
    this.prestationForm.reset();
  }

  closePrestationForm() {
    this.addingPrestationForProgramme = null;
    this.prestationForm.reset();
  }

  onSubmitPrestation(programmeId: number) {
    if (this.prestationForm.invalid) return;
    this.savingPrestation = true;
    this.api.createPrestation(programmeId, this.prestationForm.value).subscribe({
      next: pr => {
        const existing = this.prestationsMap.get(programmeId) || [];
        this.prestationsMap.set(programmeId, [...existing, pr]);
        this.prestationsMap = new Map(this.prestationsMap);
        this.savingPrestation = false;
        this.closePrestationForm();
        this.snackBar.open(this.translate.instant('PROGRAMME.PRESTATION_CREATED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingPrestation = false;
        this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  deletePrestation(pr: Prestation, programmeId: number) {
    if (!confirm(this.translate.instant('PROGRAMME.CONFIRM_DELETE_PRESTATION', { name: pr.nomFr }))) return;
    this.api.deletePrestation(pr.id).subscribe({
      next: () => {
        const existing = this.prestationsMap.get(programmeId) || [];
        this.prestationsMap.set(programmeId, existing.filter(x => x.id !== pr.id));
        this.prestationsMap = new Map(this.prestationsMap);
        this.snackBar.open(this.translate.instant('PROGRAMME.PRESTATION_DELETED'), 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }
}
