import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Programme, Prestation } from '../../core/models/etablissement.model';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>Programmes & Prestations</h1>
      <button class="btn btn-primary" (click)="openProgrammeForm()">
        <mat-icon>add</mat-icon> Nouveau programme
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- Programme Form -->
    <mat-card class="mb-2" *ngIf="showProgrammeForm">
      <mat-card-header>
        <mat-card-title>{{ editingProgrammeId ? 'Modifier' : 'Nouveau' }} programme</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="programmeForm" (ngSubmit)="onSubmitProgramme()">
          <div class="form-row">
            <div class="field">
              <label>Nom (Français) *</label>
              <input type="text" formControlName="nomFr" placeholder="Nom du programme">
              <span class="err" *ngIf="programmeForm.get('nomFr')?.invalid && programmeForm.get('nomFr')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Nom (Arabe) *</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="اسم البرنامج">
              <span class="err" *ngIf="programmeForm.get('nomAr')?.invalid && programmeForm.get('nomAr')?.touched">Champ requis</span>
            </div>
          </div>
          <div class="field mb-2">
            <label>Description</label>
            <textarea formControlName="description" rows="2" class="textarea" placeholder="Description..."></textarea>
          </div>
          <div class="form-btns">
            <button type="button" class="btn btn-outline" (click)="closeProgrammeForm()">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="programmeForm.invalid || savingProgramme">
              <mat-spinner diameter="16" *ngIf="savingProgramme" style="display:inline-block;margin-right:6px"></mat-spinner>
              {{ savingProgramme ? '' : (editingProgrammeId ? 'Enregistrer' : 'Créer') }}
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
              <button class="action-btn edit" (click)="openEditProgramme(p)" title="Modifier">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="action-btn delete" (click)="deleteProgramme(p)" title="Supprimer">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <!-- Prestations section -->
          <div class="prestations-section">
            <div class="prestations-header">
              <span class="badge badge-blue">{{ getPrestations(p.id).length }} prestation(s)</span>
              <button class="btn-add-prest" (click)="openPrestationForm(p.id)">
                <mat-icon>add</mat-icon> Ajouter prestation
              </button>
            </div>

            <!-- Prestation add form -->
            <div class="prestation-form" *ngIf="addingPrestationForProgramme === p.id">
              <form [formGroup]="prestationForm" (ngSubmit)="onSubmitPrestation(p.id)">
                <div class="form-row-sm">
                  <div class="field">
                    <label>Nom (Français) *</label>
                    <input type="text" formControlName="nomFr" placeholder="Nom de la prestation">
                    <span class="err" *ngIf="prestationForm.get('nomFr')?.invalid && prestationForm.get('nomFr')?.touched">Champ requis</span>
                  </div>
                  <div class="field">
                    <label>Nom (Arabe) *</label>
                    <input type="text" formControlName="nomAr" dir="rtl" placeholder="اسم الخدمة">
                    <span class="err" *ngIf="prestationForm.get('nomAr')?.invalid && prestationForm.get('nomAr')?.touched">Champ requis</span>
                  </div>
                  <div class="field">
                    <label>Description</label>
                    <input type="text" formControlName="description" placeholder="Description (optionnel)">
                  </div>
                </div>
                <div class="form-btns-sm">
                  <button type="button" class="btn-sm btn-outline-sm" (click)="closePrestationForm()">Annuler</button>
                  <button type="submit" class="btn-sm btn-primary-sm" [disabled]="prestationForm.invalid || savingPrestation">
                    {{ savingPrestation ? 'Enregistrement...' : 'Créer la prestation' }}
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
                <button class="action-btn-sm delete" (click)="deletePrestation(pr, p.id)" title="Supprimer">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="empty-prestations" *ngIf="getPrestations(p.id).length === 0">
                <mat-icon>info_outline</mat-icon>
                Aucune prestation — cliquez sur "Ajouter prestation" pour en créer
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="empty-state" *ngIf="programmes.length === 0">
        <mat-icon>category</mat-icon>
        <p>Aucun programme — cliquez sur "Nouveau programme" pour commencer</p>
      </div>
    </div>
  `,
  styles: [`
    .programmes-grid { display: flex; flex-direction: column; gap: 16px; }
    .programme-card { border-left: 4px solid var(--color-primary) !important; }
    .programme-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
    }
    .programme-header h3 { font-size: 16px; color: var(--color-primary); margin-bottom: 4px; }
    .nomAr { font-size: 14px; color: #888; direction: rtl; margin-bottom: 4px; }
    .description { font-size: 13px; margin-top: 4px; }
    .programme-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; background: transparent; color: #666;
    }
    .action-btn.edit:hover { color: var(--color-primary); background: #e8f5e9; }
    .action-btn.delete:hover { color: #c62828; background: #ffebee; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .prestations-section {
      background: #f9f9f9; border-radius: 8px; padding: 14px;
    }
    .prestations-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .btn-add-prest {
      display: inline-flex; align-items: center; gap: 4px;
      background: none; border: 1px dashed var(--color-primary); color: var(--color-primary);
      padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: inherit;
    }
    .btn-add-prest:hover { background: #e8f5e9; }
    .btn-add-prest mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .prestation-form {
      background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px;
      border: 1px solid #e8f5e9;
    }
    .form-row-sm {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
      gap: 12px; margin-bottom: 12px;
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.3px; }
    .field input {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;
      font-size: 14px; font-family: inherit; height: 38px; background: white;
    }
    .field input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(46,125,50,0.1); }
    .textarea {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;
      font-size: 14px; font-family: inherit; width: 100%; resize: vertical;
    }
    .textarea:focus { outline: none; border-color: var(--color-primary); }
    .mb-2 { margin-bottom: 12px; }
    .form-btns-sm { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-sm {
      padding: 7px 14px; border-radius: 6px; font-size: 13px;
      cursor: pointer; font-family: inherit; border: none; font-weight: 500;
    }
    .btn-primary-sm { background: var(--color-primary); color: white; }
    .btn-primary-sm:disabled { opacity: 0.6; cursor: default; }
    .btn-outline-sm { background: white; color: #666; border: 1px solid #ccc; }
    .prestations-list { display: flex; flex-direction: column; gap: 8px; }
    .prestation-item {
      display: flex; align-items: center; justify-content: space-between;
      background: white; border-radius: 8px; padding: 10px 14px;
      border: 1px solid #e0e0e0;
    }
    .prestation-info { display: flex; align-items: center; gap: 10px; flex: 1; }
    .prest-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }
    .prestation-nom { font-size: 14px; font-weight: 500; color: #333; }
    .prestation-nom-ar { font-size: 13px; color: #888; }
    .action-btn-sm {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border: none; border-radius: 4px;
      cursor: pointer; background: transparent; color: #aaa; flex-shrink: 0;
    }
    .action-btn-sm.delete:hover { color: #c62828; background: #ffebee; }
    .action-btn-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-prestations {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #bbb; padding: 8px; justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
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
    .empty-state {
      text-align: center; padding: 60px; color: #ccc; background: white;
      border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; }
    .empty-state p { font-size: 15px; }
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
    private cdr: ChangeDetectorRef
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
          this.editingProgrammeId ? 'Programme modifié' : 'Programme créé',
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingProgramme = false;
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  deleteProgramme(p: Programme) {
    if (!confirm(`Supprimer le programme "${p.nomFr}" et toutes ses prestations ?`)) return;
    this.api.deleteProgramme(p.id).subscribe({
      next: () => {
        this.programmes = this.programmes.filter(x => x.id !== p.id);
        this.prestationsMap.delete(p.id);
        this.prestationsMap = new Map(this.prestationsMap);
        this.snackBar.open('Programme supprimé', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
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
        this.snackBar.open('Prestation créée', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingPrestation = false;
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  deletePrestation(pr: Prestation, programmeId: number) {
    if (!confirm(`Supprimer la prestation "${pr.nomFr}" ?`)) return;
    this.api.deletePrestation(pr.id).subscribe({
      next: () => {
        const existing = this.prestationsMap.get(programmeId) || [];
        this.prestationsMap.set(programmeId, existing.filter(x => x.id !== pr.id));
        this.prestationsMap = new Map(this.prestationsMap);
        this.snackBar.open('Prestation supprimée', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }
}
