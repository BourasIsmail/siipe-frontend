import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { EtablissementCentre, Programme, Prestation } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-personnel-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEdit ? 'Modifier' : 'Ajouter' }} un Agent</h1>
      <button mat-button routerLink="/personnel">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">

      <!-- Section 1: Identité -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Identité</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Nom *</label>
              <input type="text" formControlName="nom" placeholder="Nom de famille">
              <span class="err" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Prénom *</label>
              <input type="text" formControlName="prenom" placeholder="Prénom">
              <span class="err" *ngIf="form.get('prenom')?.invalid && form.get('prenom')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>CIN</label>
              <input type="text" formControlName="cin" placeholder="AA000000">
            </div>
            <div class="field">
              <label>Sexe</label>
              <select formControlName="sexe">
                <option value="">-- Sélectionner --</option>
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Date de naissance</label>
              <input type="date" formControlName="dateNaissance">
            </div>
            <div class="field">
              <label>Lieu de naissance</label>
              <input type="text" formControlName="lieuNaissance" placeholder="Ville">
            </div>
            <div class="field">
              <label>Situation familiale</label>
              <select formControlName="situationFamille">
                <option value="">-- Sélectionner --</option>
                <option value="CELIBATAIRE">Célibataire</option>
                <option value="MARIE">Marié(e)</option>
                <option value="DIVORCE">Divorcé(e)</option>
                <option value="VEUF">Veuf/Veuve</option>
              </select>
            </div>
            <div class="field">
              <label>Nombre d'enfants</label>
              <input type="number" formControlName="nombreEnfant" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="email@entraide.ma">
            </div>
            <div class="field">
              <label>Téléphone</label>
              <input type="text" formControlName="telephone" placeholder="0600000000">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 2: Informations professionnelles -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Informations professionnelles</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Matricule *</label>
              <input type="text" formControlName="matricule" placeholder="P0000">
              <span class="err" *ngIf="form.get('matricule')?.invalid && form.get('matricule')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>N° couverture sociale</label>
              <input type="text" formControlName="numCouvertureSociale" placeholder="Numéro">
            </div>
            <div class="field">
              <label>Situation administrative</label>
              <select formControlName="situationAdministratif">
                <option value="">-- Sélectionner --</option>
                <option value="EN">Entraide Nationale</option>
                <option value="DETACHEMENT">Détachement</option>
                <option value="MIS_DISPOSITION">Mis à disposition</option>
                <option value="CONTRAT">Contrat</option>
              </select>
            </div>
            <div class="field">
              <label>Date de recrutement</label>
              <input type="date" formControlName="dateRecrutement">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Grade</label>
              <select formControlName="grade">
                <option value="">-- Sélectionner --</option>
                <option value="ADMINISTRATEUR_1ER_GRADE">Administrateur 1er grade</option>
                <option value="ADMINISTRATEUR_2EME_GRADE">Administrateur 2ème grade</option>
                <option value="ADMINISTRATEUR_3EME_GRADE">Administrateur 3ème grade</option>
                <option value="REDACTEUR_1ER_GRADE">Rédacteur 1er grade</option>
                <option value="REDACTEUR_2EME_GRADE">Rédacteur 2ème grade</option>
                <option value="REDACTEUR_3EME_GRADE">Rédacteur 3ème grade</option>
                <option value="REDACTEUR_4EME_GRADE">Rédacteur 4ème grade</option>
                <option value="TECHNICIEN_PREMIER_GRADE">Technicien 1er grade</option>
                <option value="TECHNICIEN_DEUXIEME_GRADE">Technicien 2ème grade</option>
                <option value="TECHNICIEN_TROISIEME_GRADE">Technicien 3ème grade</option>
                <option value="TECHNICIEN_QUATRIEME_GRADE">Technicien 4ème grade</option>
                <option value="ADJOINT_ADMINISTRATIF_1ER_GRADE">Adjoint admin 1er grade</option>
                <option value="ADJOINT_ADMINISTRATIF_GRADE_PRINCIPAL">Adjoint admin grade principal</option>
                <option value="ADJOINT_TECHNIQUE_1ER_GRADE">Adjoint technique 1er grade</option>
                <option value="ADJOINT_TECHNIQUE_GRADE_PRINCIPAL">Adjoint technique grade principal</option>
                <option value="AGENTS_A_CONTRAT">Agents à contrat</option>
                <option value="AGENT_EXECUTION">Agent d'exécution</option>
                <option value="AGENT_EXECUTION_PRINCIPAL">Agent d'exécution principal</option>
                <option value="AGENT_DE_SERVICE">Agent de service</option>
                <option value="INGENIEUR_EN_CHEF_PREMIER_GRADE">Ingénieur en chef 1er grade</option>
                <option value="ARCHITECTE_PREMIER_GRADE">Architecte 1er grade</option>
              </select>
            </div>
            <div class="field">
              <label>Fonction</label>
              <select formControlName="fonction">
                <option value="">-- Sélectionner --</option>
                <option value="DIRECTEUR">Directeur</option>
                <option value="DIRECTEUR_DU_CENTRE">Directeur du centre</option>
                <option value="DIRECTEUR_PROVINCIAL">Directeur provincial</option>
                <option value="DIRECTEUR_REGIONAL">Directeur régional</option>
                <option value="SOUS_DIRECTEUR">Sous directeur</option>
                <option value="CHEF_DE_DIVISION">Chef de division</option>
                <option value="CHEF_DE_SERVICE">Chef de service</option>
                <option value="INSPECTEUR">Inspecteur</option>
                <option value="RESPONSABLE_ADMINISTRATIF_FINANCIER">Responsable administratif et financier</option>
                <option value="CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE">Chef bureau administratif et technique</option>
                <option value="ASSISTANT_SOCIAL">Assistant social</option>
                <option value="MEDECIN">Médecin</option>
                <option value="INFIRMIER">Infirmier</option>
                <option value="PSYCHOLOGUE">Psychologue</option>
                <option value="EDUCATEUR">Éducateur</option>
                <option value="FORMATEUR">Formateur</option>
                <option value="AGENT_SURVEILLANCE_SECURITE">Agent de surveillance et sécurité</option>
              </select>
            </div>
            <div class="field">
              <label>Poste occupé</label>
              <select formControlName="posteOccupe">
                <option value="">-- Sélectionner --</option>
                <option value="DIRECTEUR">Directeur</option>
                <option value="DIRECTEUR_DU_CENTRE">Directeur du centre</option>
                <option value="DIRECTEUR_PROVINCIAL">Directeur provincial</option>
                <option value="DIRECTEUR_REGIONAL">Directeur régional</option>
                <option value="SOUS_DIRECTEUR">Sous directeur</option>
                <option value="CHEF_DE_DIVISION">Chef de division</option>
                <option value="CHEF_DU_SERVICE">Chef du service</option>
                <option value="INSPECTEUR">Inspecteur</option>
                <option value="CHEF_BUREAU_ADMINISTRATIF_TECHNIQUE">Chef bureau administratif et technique</option>
              </select>
            </div>
            <div class="field">
              <label>Catégorie</label>
              <select formControlName="categorie">
                <option value="">-- Sélectionner --</option>
                <option value="agent administratif">Agent administratif</option>
                <option value="cadre">Cadre</option>
                <option value="technicien">Technicien</option>
                <option value="ouvrier">Ouvrier</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Salaire (MAD)</label>
              <input type="number" formControlName="salaire" placeholder="0">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Formation -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Formation & Diplôme</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Niveau scolaire</label>
              <select formControlName="niveauScolaire">
                <option value="">-- Sélectionner --</option>
                <option value="PRESCOLAIRE_PRIMAIRE">Préscolaire & Primaire</option>
                <option value="COLLEGE">Collège</option>
                <option value="LYCEE">Lycée</option>
                <option value="FORMATION_PROFESSIONNELLE">Formation professionnelle</option>
                <option value="ETUDES_SUPERIEURES">Études supérieures</option>
              </select>
            </div>
            <div class="field">
              <label>Diplôme</label>
              <select formControlName="diplome">
                <option value="">-- Sélectionner --</option>
                <option value="BTS">BTS</option>
                <option value="DUT">DUT</option>
                <option value="BEP">BEP</option>
                <option value="DEUG">DEUG</option>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
                <option value="DOCTORAT">Doctorat</option>
                <option value="DT">Diplôme de Technicien</option>
                <option value="DTS">Diplôme de Technicien Spécialisé</option>
                <option value="CQP">CQP</option>
                <option value="CSP">CSP</option>
                <option value="DQP">DQP</option>
                <option value="DSP">DSP</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 4: Affectation -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Affectation</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Établissement / Centre *</label>
              <select formControlName="etablissementCentreId" (change)="onEtabChange($event)">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
              <span class="err" *ngIf="form.get('etablissementCentreId')?.invalid && form.get('etablissementCentreId')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Programme</label>
              <select formControlName="programmeId" (change)="onProgrammeChange($event)">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
            <div class="field">
              <label>Prestation</label>
              <select formControlName="prestationId">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let p of prestations" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-button type="button" routerLink="/personnel">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-right:8px"></mat-spinner>
          <span>{{ saving ? '' : (isEdit ? 'Enregistrer' : 'Créer') }}</span>
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
    private cdr: ChangeDetectorRef
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
          this.isEdit ? 'Agent modifié' : 'Agent créé',
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/personnel']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
