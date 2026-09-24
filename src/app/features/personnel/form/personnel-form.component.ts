import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { EtablissementCentre, Programme, Prestation } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-personnel-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ (isEdit ? 'PERSONNEL.FORM.TITLE_EDIT' : 'PERSONNEL.FORM.TITLE_ADD') | translate }}</h1>
      <button mat-button routerLink="/personnel">
        <mat-icon>arrow_back</mat-icon> {{ 'COMMON.BACK' | translate }}
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">

      <!-- Section 1: Identité -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'PERSONNEL.FORM.SECTION_IDENTITE' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.NOM' | translate }} *</label>
              <input type="text" formControlName="nom" [placeholder]="'PERSONNEL.FORM.NOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">{{ 'PERSONNEL.FORM.REQUIRED_FIELD' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.PRENOM' | translate }} *</label>
              <input type="text" formControlName="prenom" [placeholder]="'PERSONNEL.PRENOM' | translate">
              <span class="err" *ngIf="form.get('prenom')?.invalid && form.get('prenom')?.touched">{{ 'PERSONNEL.FORM.REQUIRED_FIELD' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.CIN' | translate }}</label>
              <input type="text" formControlName="cin" placeholder="AA000000">
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.SEXE' | translate }}</label>
              <select formControlName="sexe">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="MASCULIN">{{ 'PERSONNEL.FORM.SEXES.MASCULIN' | translate }}</option>
                <option value="FEMININ">{{ 'PERSONNEL.FORM.SEXES.FEMININ' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.DATE_NAISSANCE' | translate }}</label>
              <input type="date" formControlName="dateNaissance">
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.LIEU_NAISSANCE' | translate }}</label>
              <input type="text" formControlName="lieuNaissance" [placeholder]="'PERSONNEL.FORM.VILLE_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.SITUATION_FAMILLE' | translate }}</label>
              <select formControlName="situationFamille">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="CELIBATAIRE">{{ 'PERSONNEL.FORM.SITUATIONS_FAMILLE.CELIBATAIRE' | translate }}</option>
                <option value="MARIE">{{ 'PERSONNEL.FORM.SITUATIONS_FAMILLE.MARIE' | translate }}</option>
                <option value="DIVORCE">{{ 'PERSONNEL.FORM.SITUATIONS_FAMILLE.DIVORCE' | translate }}</option>
                <option value="VEUF">{{ 'PERSONNEL.FORM.SITUATIONS_FAMILLE.VEUF' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.NOMBRE_ENFANTS' | translate }}</label>
              <input type="number" formControlName="nombreEnfant" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.EMAIL' | translate }}</label>
              <input type="email" formControlName="email" placeholder="email@entraide.ma">
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.TELEPHONE' | translate }}</label>
              <input type="text" formControlName="telephone" placeholder="0600000000">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 2: Informations professionnelles -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'PERSONNEL.FORM.SECTION_INFOS_PRO' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.MATRICULE' | translate }} *</label>
              <input type="text" formControlName="matricule" placeholder="P0000">
              <span class="err" *ngIf="form.get('matricule')?.invalid && form.get('matricule')?.touched">{{ 'PERSONNEL.FORM.REQUIRED_FIELD' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.NUM_COUVERTURE_SOCIALE' | translate }}</label>
              <input type="text" formControlName="numCouvertureSociale" [placeholder]="'PERSONNEL.FORM.NUMERO_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.SITUATION_ADMINISTRATIVE' | translate }}</label>
              <select formControlName="situationAdministratif">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="EN">{{ 'PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.EN' | translate }}</option>
                <option value="DETACHEMENT">{{ 'PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.DETACHEMENT' | translate }}</option>
                <option value="MIS_DISPOSITION">{{ 'PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.MIS_DISPOSITION' | translate }}</option>
                <option value="CONTRAT">{{ 'PERSONNEL.FORM.SITUATIONS_ADMINISTRATIVES.CONTRAT' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.DATE_RECRUTEMENT' | translate }}</label>
              <input type="date" formControlName="dateRecrutement">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.GRADE' | translate }}</label>
              <select formControlName="grade">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="ADMINISTRATEUR_1ER_GRADE">{{ 'PERSONNEL.FORM.GRADES.ADMINISTRATEUR_1ER_GRADE' | translate }}</option>
                <option value="ADMINISTRATEUR_2EME_GRADE">{{ 'PERSONNEL.FORM.GRADES.ADMINISTRATEUR_2EME_GRADE' | translate }}</option>
                <option value="ADMINISTRATEUR_3EME_GRADE">{{ 'PERSONNEL.FORM.GRADES.ADMINISTRATEUR_3EME_GRADE' | translate }}</option>
                <option value="REDACTEUR_1ER_GRADE">{{ 'PERSONNEL.FORM.GRADES.REDACTEUR_1ER_GRADE' | translate }}</option>
                <option value="REDACTEUR_2EME_GRADE">{{ 'PERSONNEL.FORM.GRADES.REDACTEUR_2EME_GRADE' | translate }}</option>
                <option value="REDACTEUR_3EME_GRADE">{{ 'PERSONNEL.FORM.GRADES.REDACTEUR_3EME_GRADE' | translate }}</option>
                <option value="REDACTEUR_4EME_GRADE">{{ 'PERSONNEL.FORM.GRADES.REDACTEUR_4EME_GRADE' | translate }}</option>
                <option value="TECHNICIEN_PREMIER_GRADE">{{ 'PERSONNEL.FORM.GRADES.TECHNICIEN_PREMIER_GRADE' | translate }}</option>
                <option value="TECHNICIEN_DEUXIEME_GRADE">{{ 'PERSONNEL.FORM.GRADES.TECHNICIEN_DEUXIEME_GRADE' | translate }}</option>
                <option value="TECHNICIEN_TROISIEME_GRADE">{{ 'PERSONNEL.FORM.GRADES.TECHNICIEN_TROISIEME_GRADE' | translate }}</option>
                <option value="TECHNICIEN_QUATRIEME_GRADE">{{ 'PERSONNEL.FORM.GRADES.TECHNICIEN_QUATRIEME_GRADE' | translate }}</option>
                <option value="ADJOINT_ADMINISTRATIF_1ER_GRADE">{{ 'PERSONNEL.FORM.GRADES.ADJOINT_ADMINISTRATIF_1ER_GRADE' | translate }}</option>
                <option value="ADJOINT_ADMINISTRATIF_GRADE_PRINCIPAL">{{ 'PERSONNEL.FORM.GRADES.ADJOINT_ADMINISTRATIF_GRADE_PRINCIPAL' | translate }}</option>
                <option value="ADJOINT_TECHNIQUE_1ER_GRADE">{{ 'PERSONNEL.FORM.GRADES.ADJOINT_TECHNIQUE_1ER_GRADE' | translate }}</option>
                <option value="ADJOINT_TECHNIQUE_GRADE_PRINCIPAL">{{ 'PERSONNEL.FORM.GRADES.ADJOINT_TECHNIQUE_GRADE_PRINCIPAL' | translate }}</option>
                <option value="AGENTS_A_CONTRAT">{{ 'PERSONNEL.FORM.GRADES.AGENTS_A_CONTRAT' | translate }}</option>
                <option value="AGENT_EXECUTION">{{ 'PERSONNEL.FORM.GRADES.AGENT_EXECUTION' | translate }}</option>
                <option value="AGENT_EXECUTION_PRINCIPAL">{{ 'PERSONNEL.FORM.GRADES.AGENT_EXECUTION_PRINCIPAL' | translate }}</option>
                <option value="AGENT_DE_SERVICE">{{ 'PERSONNEL.FORM.GRADES.AGENT_DE_SERVICE' | translate }}</option>
                <option value="INGENIEUR_EN_CHEF_PREMIER_GRADE">{{ 'PERSONNEL.FORM.GRADES.INGENIEUR_EN_CHEF_PREMIER_GRADE' | translate }}</option>
                <option value="ARCHITECTE_PREMIER_GRADE">{{ 'PERSONNEL.FORM.GRADES.ARCHITECTE_PREMIER_GRADE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FONCTION' | translate }}</label>
              <select formControlName="fonction">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="DIRECTEUR">{{ 'PERSONNEL.FORM.FONCTIONS.DIRECTEUR' | translate }}</option>
                <option value="DIRECTEUR_DU_CENTRE">{{ 'PERSONNEL.FORM.FONCTIONS.DIRECTEUR_DU_CENTRE' | translate }}</option>
                <option value="DIRECTEUR_PROVINCIAL">{{ 'PERSONNEL.FORM.FONCTIONS.DIRECTEUR_PROVINCIAL' | translate }}</option>
                <option value="DIRECTEUR_REGIONAL">{{ 'PERSONNEL.FORM.FONCTIONS.DIRECTEUR_REGIONAL' | translate }}</option>
                <option value="SOUS_DIRECTEUR">{{ 'PERSONNEL.FORM.FONCTIONS.SOUS_DIRECTEUR' | translate }}</option>
                <option value="CHEF_DE_DIVISION">{{ 'PERSONNEL.FORM.FONCTIONS.CHEF_DE_DIVISION' | translate }}</option>
                <option value="CHEF_DE_SERVICE">{{ 'PERSONNEL.FORM.FONCTIONS.CHEF_DE_SERVICE' | translate }}</option>
                <option value="INSPECTEUR">{{ 'PERSONNEL.FORM.FONCTIONS.INSPECTEUR' | translate }}</option>
                <option value="RESPONSABLE_ADMINISTRATIF_FINANCIER">{{ 'PERSONNEL.FORM.FONCTIONS.RESPONSABLE_ADMINISTRATIF_FINANCIER' | translate }}</option>
                <option value="CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE">{{ 'PERSONNEL.FORM.FONCTIONS.CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE' | translate }}</option>
                <option value="ASSISTANT_SOCIAL">{{ 'PERSONNEL.FORM.FONCTIONS.ASSISTANT_SOCIAL' | translate }}</option>
                <option value="MEDECIN">{{ 'PERSONNEL.FORM.FONCTIONS.MEDECIN' | translate }}</option>
                <option value="INFIRMIER">{{ 'PERSONNEL.FORM.FONCTIONS.INFIRMIER' | translate }}</option>
                <option value="PSYCHOLOGUE">{{ 'PERSONNEL.FORM.FONCTIONS.PSYCHOLOGUE' | translate }}</option>
                <option value="EDUCATEUR">{{ 'PERSONNEL.FORM.FONCTIONS.EDUCATEUR' | translate }}</option>
                <option value="FORMATEUR">{{ 'PERSONNEL.FORM.FONCTIONS.FORMATEUR' | translate }}</option>
                <option value="AGENT_SURVEILLANCE_SECURITE">{{ 'PERSONNEL.FORM.FONCTIONS.AGENT_SURVEILLANCE_SECURITE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.POSTE_OCCUPE' | translate }}</label>
              <select formControlName="posteOccupe">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="DIRECTEUR">{{ 'PERSONNEL.FORM.POSTES.DIRECTEUR' | translate }}</option>
                <option value="DIRECTEUR_DU_CENTRE">{{ 'PERSONNEL.FORM.POSTES.DIRECTEUR_DU_CENTRE' | translate }}</option>
                <option value="DIRECTEUR_PROVINCIAL">{{ 'PERSONNEL.FORM.POSTES.DIRECTEUR_PROVINCIAL' | translate }}</option>
                <option value="DIRECTEUR_REGIONAL">{{ 'PERSONNEL.FORM.POSTES.DIRECTEUR_REGIONAL' | translate }}</option>
                <option value="SOUS_DIRECTEUR">{{ 'PERSONNEL.FORM.POSTES.SOUS_DIRECTEUR' | translate }}</option>
                <option value="CHEF_DE_DIVISION">{{ 'PERSONNEL.FORM.POSTES.CHEF_DE_DIVISION' | translate }}</option>
                <option value="CHEF_DU_SERVICE">{{ 'PERSONNEL.FORM.POSTES.CHEF_DU_SERVICE' | translate }}</option>
                <option value="INSPECTEUR">{{ 'PERSONNEL.FORM.POSTES.INSPECTEUR' | translate }}</option>
                <option value="CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE">{{ 'PERSONNEL.FORM.POSTES.CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.CATEGORIE' | translate }}</label>
              <select formControlName="categorie">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="agent administratif">{{ 'PERSONNEL.FORM.CATEGORIES.AGENT_ADMINISTRATIF' | translate }}</option>
                <option value="cadre">{{ 'PERSONNEL.FORM.CATEGORIES.CADRE' | translate }}</option>
                <option value="technicien">{{ 'PERSONNEL.FORM.CATEGORIES.TECHNICIEN' | translate }}</option>
                <option value="ouvrier">{{ 'PERSONNEL.FORM.CATEGORIES.OUVRIER' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.SALAIRE' | translate }}</label>
              <input type="number" formControlName="salaire" placeholder="0">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Formation -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'PERSONNEL.FORM.SECTION_FORMATION' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.NIVEAU_SCOLAIRE' | translate }}</label>
              <select formControlName="niveauScolaire">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="PRESCOLAIRE_PRIMAIRE">{{ 'PERSONNEL.FORM.NIVEAUX_SCOLAIRE.PRESCOLAIRE_PRIMAIRE' | translate }}</option>
                <option value="COLLEGE">{{ 'PERSONNEL.FORM.NIVEAUX_SCOLAIRE.COLLEGE' | translate }}</option>
                <option value="LYCEE">{{ 'PERSONNEL.FORM.NIVEAUX_SCOLAIRE.LYCEE' | translate }}</option>
                <option value="FORMATION_PROFESSIONNELLE">{{ 'PERSONNEL.FORM.NIVEAUX_SCOLAIRE.FORMATION_PROFESSIONNELLE' | translate }}</option>
                <option value="ETUDES_SUPERIEURES">{{ 'PERSONNEL.FORM.NIVEAUX_SCOLAIRE.ETUDES_SUPERIEURES' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.DIPLOME' | translate }}</label>
              <select formControlName="diplome">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="BTS">{{ 'PERSONNEL.FORM.DIPLOMES.BTS' | translate }}</option>
                <option value="DUT">{{ 'PERSONNEL.FORM.DIPLOMES.DUT' | translate }}</option>
                <option value="BEP">{{ 'PERSONNEL.FORM.DIPLOMES.BEP' | translate }}</option>
                <option value="DEUG">{{ 'PERSONNEL.FORM.DIPLOMES.DEUG' | translate }}</option>
                <option value="LICENCE">{{ 'PERSONNEL.FORM.DIPLOMES.LICENCE' | translate }}</option>
                <option value="MASTER">{{ 'PERSONNEL.FORM.DIPLOMES.MASTER' | translate }}</option>
                <option value="DOCTORAT">{{ 'PERSONNEL.FORM.DIPLOMES.DOCTORAT' | translate }}</option>
                <option value="DT">{{ 'PERSONNEL.FORM.DIPLOMES.DT' | translate }}</option>
                <option value="DTS">{{ 'PERSONNEL.FORM.DIPLOMES.DTS' | translate }}</option>
                <option value="CQP">{{ 'PERSONNEL.FORM.DIPLOMES.CQP' | translate }}</option>
                <option value="CSP">{{ 'PERSONNEL.FORM.DIPLOMES.CSP' | translate }}</option>
                <option value="DQP">{{ 'PERSONNEL.FORM.DIPLOMES.DQP' | translate }}</option>
                <option value="DSP">{{ 'PERSONNEL.FORM.DIPLOMES.DSP' | translate }}</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 4: Affectation -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'PERSONNEL.FORM.SECTION_AFFECTATION' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.ETABLISSEMENT_CENTRE' | translate }} *</label>
              <select formControlName="etablissementCentreId" (change)="onEtabChange($event)">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
              <span class="err" *ngIf="form.get('etablissementCentreId')?.invalid && form.get('etablissementCentreId')?.touched">{{ 'PERSONNEL.FORM.REQUIRED_FIELD' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.PROGRAMME' | translate }}</label>
              <select formControlName="programmeId" (change)="onProgrammeChange($event)">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'PERSONNEL.FORM.PRESTATION' | translate }}</label>
              <select formControlName="prestationId">
                <option value="">{{ 'PERSONNEL.FORM.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of prestations" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-button type="button" routerLink="/personnel">{{ 'COMMON.CANCEL' | translate }}</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-right:8px"></mat-spinner>
          <span>{{ saving ? '' : ((isEdit ? 'COMMON.SAVE' : 'PERSONNEL.FORM.CREATE') | translate) }}</span>
        </button>
      </div>

    </form>
  `,
  styles: [`
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 13px; font-weight: 500; color: #555; }
    .field input, .field select {
      padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; background: white;
      color: #333; height: 42px;
    }
    .field input:focus, .field select:focus {
      outline: none; border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(46,125,50,0.12);
    }
    .err { color: #d32f2f; font-size: 12px; }
    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 12px; margin-top: 16px; margin-bottom: 32px;
    }
  `]
})
export class PersonnelFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;
  etablissements: EtablissementCentre[] = [];
  programmes: Programme[] = [];
  prestations: Prestation[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.buildForm();

    this.api.getEtablissements().subscribe({
      next: e => { this.etablissements = [...e]; this.cdr.detectChanges(); }
    });

    this.api.getProgrammes().subscribe({
      next: p => { this.programmes = [...p]; this.cdr.detectChanges(); }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loading = true;
      this.api.getPersonnelById(+id).subscribe({
        next: p => {
          this.form.patchValue(p);
          if (p.programmeId) {
            this.api.getPrestationsByProgramme(p.programmeId).subscribe(pr => {
              this.prestations = [...pr];
              this.cdr.detectChanges();
            });
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/personnel']);
        }
      });
    }
  }

  buildForm() {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      cin: [''],
      sexe: [''],
      dateNaissance: [''],
      lieuNaissance: [''],
      situationFamille: [''],
      nombreEnfant: [null],
      email: [''],
      telephone: [''],
      matricule: ['', Validators.required],
      numCouvertureSociale: [''],
      situationAdministratif: [''],
      dateRecrutement: [''],
      grade: [''],
      fonction: [''],
      posteOccupe: [''],
      categorie: [''],
      salaire: [null],
      niveauScolaire: [''],
      diplome: [''],
      etablissementCentreId: ['', Validators.required],
      programmeId: [''],
      prestationId: [''],
      roleDescription: [''],
      organisation: [null],
      activite: [null],
      specialisation: [null],
      initiative: [null],
      autonomie: [null],
      adaptationProfessionnelle: [null],
      relationsTravail: [null],
      techniqueExecution: [null],
      communication: [null],
      toleranceStress: [null],
      assiduitePointage: [null],
      servicePopulation: [null]
    });
  }

  onEtabChange(event: any) {
    // Could filter programmes by etablissement if needed
  }

  onProgrammeChange(event: any) {
    const programmeId = event.target?.value;
    if (!programmeId) { this.prestations = []; return; }
    this.api.getPrestationsByProgramme(+programmeId).subscribe({
      next: p => { this.prestations = [...p]; this.cdr.detectChanges(); }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const data = this.form.value;

    const request = this.isEdit
      ? this.api.updatePersonnel(+id!, data)
      : this.api.createPersonnel(data);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant(this.isEdit ? 'PERSONNEL.FORM.UPDATED' : 'PERSONNEL.FORM.CREATED'),
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/personnel']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
