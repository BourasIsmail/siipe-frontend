import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { Personnel } from '../../../core/models/personnel.model';

interface EvalCritere {
  key: string;
  obsKey: string;
}

@Component({
  selector: 'app-personnel-evaluation',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, TranslateModule
  ],
  template: `
    <div *ngIf="loading" class="flex-center" style="height:300px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <ng-container *ngIf="!loading && personnel">
      <div class="page-header">
        <button class="btn btn-outline" [routerLink]="['/personnel', personnel.id]">
          <mat-icon>arrow_back</mat-icon> {{ 'COMMON.BACK' | translate }}
        </button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving">
          <mat-spinner diameter="16" *ngIf="saving" style="display:inline-block;margin-inline-end:6px"></mat-spinner>
          <mat-icon *ngIf="!saving">save</mat-icon>
          {{ saving ? ('PERSONNEL.EVALUATION.SAVING' | translate) : ('COMMON.SAVE' | translate) }}
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="eval-title">{{ 'PERSONNEL.EVALUATION.SHEET_TITLE' | translate }}</div>
          <div class="eval-subtitle">{{ personnel.nom }} {{ personnel.prenom }} — {{ personnel.matricule }}</div>

          <div class="table-wrap">
            <table class="eval-table">
              <thead>
                <tr>
                  <th class="col-competence">{{ 'PERSONNEL.EVALUATION.COMPETENCES' | translate }}</th>
                  <th class="col-note" *ngFor="let n of [1,2,3,4,5]">{{ n }}</th>
                  <th class="col-total">{{ 'PERSONNEL.EVALUATION.TOTAL_POINTS' | translate }}</th>
                  <th class="col-obs">{{ 'PERSONNEL.EVALUATION.COMMENT_OBSERVATION' | translate }}<br><small>{{ 'PERSONNEL.EVALUATION.ACTIONS_RECOMMENDATION' | translate }}</small></th>
                </tr>
                <tr class="sub-header">
                  <th></th>
                  <th colspan="5" class="cote-header">{{ 'PERSONNEL.EVALUATION.APPRECIATION_SCALE' | translate }}</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of criteres">
                  <td class="col-competence">
                    <div class="competence-label">{{ getCriterionLabel(c.key) }}</div>
                    <div class="competence-desc">{{ getCriterionDescription(c.key) }}</div>
                  </td>
                  <td class="col-note" *ngFor="let n of [1,2,3,4,5]">
                    <label class="radio-label">
                      <input type="radio" [name]="c.key" [value]="n" [(ngModel)]="scores[c.key]">
                      <span class="radio-custom" [class.checked]="scores[c.key] === n"></span>
                    </label>
                  </td>
                  <td class="col-total">
                    <strong *ngIf="scores[c.key]">{{ scores[c.key] }}</strong>
                    <span *ngIf="!scores[c.key]" class="text-secondary">—</span>
                  </td>
                  <td class="col-obs">
                    <textarea
                      [(ngModel)]="observations[c.obsKey]"
                      rows="3"
                      class="obs-textarea"
                      [placeholder]="'PERSONNEL.EVALUATION.OBSERVATION_PLACEHOLDER' | translate">
                    </textarea>
                  </td>
                </tr>
                <!-- Total row -->
                <tr class="total-row">
                  <td class="col-competence"><strong>{{ 'PERSONNEL.EVALUATION.TOTAL_GENERAL' | translate }}</strong></td>
                  <td colspan="5"></td>
                  <td class="col-total">
                    <strong class="total-score" [style.color]="getTotalColor()">{{ totalScore }}</strong>
                    <div class="text-secondary" style="font-size:11px">/ {{ criteres.length * 5 }}</div>
                  </td>
                  <td class="col-obs">
                    <div class="score-badge" [style.background]="getTotalColor()">
                      {{ getAppreciation() }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer; font-weight: 500;
    }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-outline { background: white; color: #555; border: 1px solid #ccc; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn:disabled { opacity: 0.6; cursor: default; }

    .eval-title {
      text-align: center; font-size: 18px; font-weight: 700;
      color: var(--color-primary); margin-bottom: 4px; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .eval-subtitle {
      text-align: center; font-size: 14px; color: #666; margin-bottom: 20px;
    }

    .table-wrap { overflow-x: auto; }
    .eval-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .eval-table th, .eval-table td {
      border: 1px solid #ccc; padding: 8px 10px; vertical-align: middle;
    }
    .eval-table thead th {
      background: var(--color-primary); color: white;
      text-align: center; font-weight: 600; font-size: 12px;
    }
    .sub-header th { background: #43a047 !important; font-size: 11px; }
    .cote-header { text-align: center; }

    .col-competence { width: 30%; text-align: start; }
    .col-note { width: 6%; text-align: center; }
    .col-total { width: 8%; text-align: center; }
    .col-obs { width: 22%; }

    .competence-label { font-weight: 600; color: #333; margin-bottom: 4px; font-size: 13px; }
    .competence-desc { font-size: 12px; color: #666; line-height: 1.4; }

    .radio-label {
      display: flex; justify-content: center; align-items: center; cursor: pointer;
    }
    .radio-label input[type="radio"] { display: none; }
    .radio-custom {
      width: 20px; height: 20px; border-radius: 50%;
      border: 2px solid #ccc; background: white;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; position: relative;
    }
    .radio-custom.checked {
      border-color: var(--color-primary); background: var(--color-primary);
    }
    .radio-custom.checked::after {
      content: '✓'; color: white; font-size: 12px; font-weight: 700;
    }

    .obs-textarea {
      width: 100%; border: 1px solid #ddd; border-radius: 4px;
      padding: 6px 8px; font-size: 12px; font-family: inherit;
      resize: vertical; min-height: 60px;
    }
    .obs-textarea:focus { outline: none; border-color: var(--color-primary); }

    .total-row td { background: #f5f5f5; }
    .total-score { font-size: 20px; color: var(--color-primary); }
    .score-badge {
      color: white; padding: 6px 12px; border-radius: 6px;
      text-align: center; font-weight: 600; font-size: 13px;
    }
  `]
})
export class PersonnelEvaluationComponent implements OnInit {
  personnel: Personnel | null = null;
  loading = true;
  saving = false;
  scores: Record<string, number> = {};
  observations: Record<string, string> = {};

  readonly criteres: EvalCritere[] = [
    { key: 'organisation', obsKey: 'observation1' },
    { key: 'activite', obsKey: 'observation1' },
    { key: 'specialisation', obsKey: 'observation2' },
    { key: 'initiative', obsKey: 'observation2' },
    { key: 'autonomie', obsKey: 'observation2' },
    { key: 'adaptationProfessionnelle', obsKey: 'observation2' },
    { key: 'relationsTravail', obsKey: 'observation3' },
    { key: 'techniqueExecution', obsKey: 'observation3' },
    { key: 'communication', obsKey: 'observation3' },
    { key: 'toleranceStress', obsKey: 'observation3' },
    { key: 'assiduitePointage', obsKey: 'observation3' },
    { key: 'servicePopulation', obsKey: 'observation3' },
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.getPersonnelById(+id).subscribe({
      next: p => {
        this.personnel = p;
        // Load existing scores
        this.scores = {
          organisation: p.organisation || 0,
          activite: p.activite || 0,
          specialisation: p.specialisation || 0,
          initiative: p.initiative || 0,
          autonomie: p.autonomie || 0,
          adaptationProfessionnelle: p.adaptationProfessionnelle || 0,
          relationsTravail: p.relationsTravail || 0,
          techniqueExecution: p.techniqueExecution || 0,
          communication: p.communication || 0,
          toleranceStress: p.toleranceStress || 0,
          assiduitePointage: p.assiduitePointage || 0,
          servicePopulation: p.servicePopulation || 0,
        };
        this.observations = {
          observation1: p.observation1 || '',
          observation2: p.observation2 || '',
          observation3: p.observation3 || '',
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
  }

  get totalScore(): number {
    return Object.values(this.scores).reduce((sum, v) => sum + (v || 0), 0);
  }

  getCriterionLabel(key: string): string {
    return this.translate.instant('PERSONNEL.EVALUATION.CRITERES.' + key + '.LABEL');
  }

  getCriterionDescription(key: string): string {
    return this.translate.instant('PERSONNEL.EVALUATION.CRITERES.' + key + '.DESCRIPTION');
  }

  getTotalColor(): string {
    const max = this.criteres.length * 5;
    const pct = this.totalScore / max;
    if (pct >= 0.8) return '#2e7d32';
    if (pct >= 0.6) return '#f57c00';
    if (pct >= 0.4) return '#e65100';
    return '#c62828';
  }

  getAppreciation(): string {
    const max = this.criteres.length * 5;
    const pct = this.totalScore / max;
    if (pct >= 0.8) return this.translate.instant('PERSONNEL.EVALUATION.APPRECIATIONS.TRES_BIEN');
    if (pct >= 0.6) return this.translate.instant('PERSONNEL.EVALUATION.APPRECIATIONS.BIEN');
    if (pct >= 0.4) return this.translate.instant('PERSONNEL.EVALUATION.APPRECIATIONS.ASSEZ_BIEN');
    return this.translate.instant('PERSONNEL.EVALUATION.APPRECIATIONS.INSUFFISANT');
  }

  save() {
    if (!this.personnel) return;
    this.saving = true;
    const data = {
      ...this.scores,
      ...this.observations
    };
    this.api.updatePersonnel(this.personnel.id, { ...this.personnel, ...data }).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('PERSONNEL.EVALUATION.SAVED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.router.navigate(['/personnel', this.personnel!.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
