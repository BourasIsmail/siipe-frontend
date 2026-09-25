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
import { AuthService } from '../../../core/auth/auth.service';
import { EtablissementCentre, Programme, Prestation } from '../../../core/models/etablissement.model';
import { SITUATIONS_DIFFICULTE } from '../../../core/models/beneficiaire.model';

@Component({
  selector: 'app-beneficiaire-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ (isEdit ? 'BENEFICIAIRE.FORM.TITLE_EDIT' : 'BENEFICIAIRE.FORM.TITLE_ADD') | translate }}</h1>
      <button mat-button routerLink="/beneficiaires">
        <mat-icon>arrow_back</mat-icon> {{ 'COMMON.BACK' | translate }}
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">

      <!-- Section 1: Inscription -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'MENU.INSCRIPTION' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.VISITES_A_DOMICILE' | translate }}</label>
              <select formControlName="visitesADomicile">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="true">{{ 'COMMON.YES' | translate }}</option>
                <option value="false">{{ 'COMMON.NO' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }} *</label>
              <select formControlName="etablissementCentreId">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
              </select>
              <span class="err" *ngIf="form.get('etablissementCentreId')?.invalid && form.get('etablissementCentreId')?.touched">{{ 'ETABLISSEMENT.FORM.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }}</label>
              <select formControlName="programmeId" (change)="onProgrammeChange($event)">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.NOM' | translate }} *</label>
              <input type="text" formControlName="nom" [placeholder]="'PERSONNEL.FORM.NOM_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">{{ 'ETABLISSEMENT.FORM.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.PRENOM' | translate }}</label>
              <input type="text" formControlName="prenom" [placeholder]="'BENEFICIAIRE.PRENOM' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.NOM_ARABE' | translate }} *</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="الاسم">
              <span class="err" *ngIf="form.get('nomAr')?.invalid && form.get('nomAr')?.touched">{{ 'ETABLISSEMENT.FORM.REQUIRED' | translate }}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.PRENOM_AR' | translate }}</label>
              <input type="text" formControlName="prenomAr" dir="rtl" placeholder="النسب">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.SEXE' | translate }}</label>
              <select formControlName="sexe">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="MASCULIN">{{ 'BENEFICIAIRE.MASCULIN' | translate }}</option>
                <option value="FEMININ">{{ 'BENEFICIAIRE.FEMININ' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.DATE_ACCUEIL' | translate }}</label>
              <input type="date" formControlName="dateEntree">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.NUMERO_DOSSIER' | translate }} *</label>
              <input type="text" formControlName="numeroDossier" [placeholder]="'BENEFICIAIRE.FORM.NUMERO_DOSSIER_PLACEHOLDER' | translate">
              <span class="err" *ngIf="form.get('numeroDossier')?.invalid && form.get('numeroDossier')?.touched">{{ 'ETABLISSEMENT.FORM.REQUIRED' | translate }}</span>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.ALIAS' | translate }}</label>
              <input type="text" formControlName="alias" [placeholder]="'BENEFICIAIRE.DETAIL.ALIAS' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.NATIONALITE' | translate }}</label>
              <input type="text" formControlName="nationalite" [placeholder]="'BENEFICIAIRE.FORM.NATIONALITE_PLACEHOLDER' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DATE_NAISSANCE' | translate }}</label>
              <input type="date" formControlName="dateNaissance">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.TYPE_PIECE_IDENTITE' | translate }}</label>
              <select formControlName="typePieceIdentite">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Sans">{{ 'DICT.SANS' | translate }}</option>
                <option value="CIN">{{ 'DICT.CIN' | translate }}</option>
                <option value="Passeport">{{ 'DICT.PASSEPORT' | translate }}</option>
                <option value="Acte de naissance">{{ 'DICT.ACTE_DE_NAISSANCE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.NUMERO_PIECE_IDENTITE' | translate }}</label>
              <input type="text" formControlName="cin" [placeholder]="'PERSONNEL.FORM.NUMERO_PLACEHOLDER' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.SITUATION_SCOLAIRE_LABEL' | translate }}</label>
              <select formControlName="situationScolaire">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Scolarisé">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.SCOLARISE' | translate }}</option>
                <option value="Déscolarisé">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.DESCOLARISE' | translate }}</option>
                <option value="Analphabète">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ANALPHABETE' | translate }}</option>
                <option value="Alphabétisation">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ALPHABETISATION' | translate }}</option>
                <option value="Ecole coranique">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.ECOLE_CORANIQUE' | translate }}</option>
                <option value="Formation professionnelle">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.FORMATION_PROFESSIONNELLE' | translate }}</option>
                <option value="Non scolarisé">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.NON_SCOLARISE' | translate }}</option>
                <option value="Education non formelle">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.EDUCATION_NON_FORMELLE' | translate }}</option>
                <option value="En formation Professionnelle">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.EN_FORMATION_PROFESSIONNELLE' | translate }}</option>
                <option value="Décrochage scolaire">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_SCOLAIRE.DECROCHAGE_SCOLAIRE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE' | translate }}</label>
              <input type="text" formControlName="situationFamiliale" [placeholder]="'BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.TEMOIGNAGE_FAMILLE_LABEL' | translate }}</label>
              <input type="text" formControlName="temoignageFamille" [placeholder]="'BENEFICIAIRE.FORM.TEMOIGNAGE_PLACEHOLDER' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field" style="grid-column: span 2">
              <label>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE' | translate }}</label>
              <textarea formControlName="descriptionPhysique" rows="3" style="padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;width:100%"></textarea>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.ETAT_SANTE_PSYCHIQUE_LABEL' | translate }}</label>
              <select formControlName="etatSantePsychique">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Avec troubles psychique">{{ 'BENEFICIAIRE.OPTIONS.ETAT_SANTE_PSYCHIQUE.AVEC_TROUBLES' | translate }}</option>
                <option value="Sans troubles psychique">{{ 'BENEFICIAIRE.OPTIONS.ETAT_SANTE_PSYCHIQUE.SANS_TROUBLES' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL' | translate }}</label>
              <select formControlName="situationProfessionnelle">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Élève">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ELEVE' | translate }}</option>
                <option value="Etudiant(e)">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ETUDIANT' | translate }}</option>
                <option value="Jeune femme au foyer">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.FEMME_AU_FOYER' | translate }}</option>
                <option value="Journalier(e)">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.JOURNALIER' | translate }}</option>
                <option value="Sans">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SANS' | translate }}</option>
                <option value="Salarié(e) dans le secteur privé">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SALARIE_PRIVE' | translate }}</option>
                <option value="Salarié(e) dans le secteur public">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.SALARIE_PUBLIC' | translate }}</option>
                <option value="Retraité(e)">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.RETRAITE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.SOURCE_REVENU' | translate }}</label>
              <input type="text" formControlName="sourceRevenu" [placeholder]="'BENEFICIAIRE.DETAIL.SOURCE_REVENU' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL' | translate }}</label>
              <select formControlName="couvertureSociale">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Ramed">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.RAMED' | translate }}</option>
                <option value="Sans couverture">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.SANS_COUVERTURE' | translate }}</option>
                <option value="AMO CNSS">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.AMO_CNSS' | translate }}</option>
                <option value="AMO CNOPS">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.AMO_CNOPS' | translate }}</option>
                <option value="Assurance privée">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.ASSURANCE_PRIVEE' | translate }}</option>
                <option value="Mutuelle">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.MUTUELLE' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL' | translate }}</label>
              <select formControlName="revenuMensuel">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Moins de 500">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.MOINS_500' | translate }}</option>
                <option value="500 < revenu < 1000">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_500_A_1000' | translate }}</option>
                <option value="1000 < revenu < 1500">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_1000_A_1500' | translate }}</option>
                <option value="1500 < revenu < 2000">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.DE_1500_A_2000' | translate }}</option>
                <option value="Plus de 2000">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.PLUS_2000' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.ETAT_COMPORTEMENT_LABEL' | translate }}</label>
              <select formControlName="etatComportement">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option value="Agitation motrice">{{ 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.AGITATION_MOTRICE' | translate }}</option>
                <option value="L'impulsivité">{{ 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.IMPULSIVITE' | translate }}</option>
                <option value="L'agressivité">{{ 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.AGRESSIVITE' | translate }}</option>
                <option value="La désobéissance">{{ 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.DESOBEISSANCE' | translate }}</option>
                <option value="L'instabilité émotionnelle">{{ 'BENEFICIAIRE.OPTIONS.ETAT_COMPORTEMENT.INSTABILITE_EMOTIONNELLE' | translate }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.ADRESSE' | translate }}</label>
              <input type="text" formControlName="adresse" [placeholder]="'BENEFICIAIRE.DETAIL.ADRESSE' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field" style="grid-column: span 3">
              <label>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}</label>
              <textarea formControlName="description" rows="3" style="padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;width:100%"></textarea>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 2: Famille -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'BENEFICIAIRE.DETAIL.TAB_FAMILLE' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.NOM_PERE_LABEL' | translate }}</label>
              <input type="text" formControlName="nomPere" [placeholder]="'BENEFICIAIRE.FORM.NOM_PERE_PLACEHOLDER' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.NOM_MERE_LABEL' | translate }}</label>
              <input type="text" formControlName="nomMere" [placeholder]="'BENEFICIAIRE.FORM.NOM_MERE_LABEL' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.NOM_TUTEUR_LABEL' | translate }}</label>
              <input type="text" formControlName="nomTuteur" [placeholder]="'BENEFICIAIRE.FORM.NOM_TUTEUR_LABEL' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.TELEPHONE_PARENT_LABEL' | translate }}</label>
              <input type="text" formControlName="telephoneParent" [placeholder]="'BENEFICIAIRE.DETAIL.TELEPHONE' | translate">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.ADRESSE_PARENT_LABEL' | translate }}</label>
              <input type="text" formControlName="adresseParent" [placeholder]="'BENEFICIAIRE.DETAIL.ADRESSE' | translate">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Situation de difficulté -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>{{ 'BENEFICIAIRE.SITUATION' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.SITUATION' | translate }}</label>
              <select formControlName="situationDifficulte">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let s of situations" [value]="s">{{ ('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + s | translate) }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.DATE_SORTIE' | translate }}</label>
              <input type="date" formControlName="dateSortie">
            </div>
            <div class="field">
              <label>{{ 'BENEFICIAIRE.FORM.MOTIF_SORTIE_LABEL' | translate }}</label>
              <input type="text" formControlName="motifSortie" [placeholder]="'BENEFICIAIRE.FORM.MOTIF_PLACEHOLDER' | translate">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }}</label>
              <select formControlName="prestationId">
                <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                <option *ngFor="let p of prestations" [value]="p.id">{{ p.nomFr }}</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-button type="button" routerLink="/beneficiaires">{{ 'COMMON.CANCEL' | translate }}</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-inline-end:8px"></mat-spinner>
          <span>{{ saving ? '' : ((isEdit ? 'COMMON.SAVE' : 'BENEFICIAIRE.FORM.SUBMIT_INSCRIRE') | translate) }}</span>
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
export class BeneficiaireFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;
  etablissements: EtablissementCentre[] = [];
  programmes: Programme[] = [];
  prestations: Prestation[] = [];
  situations = SITUATIONS_DIFFICULTE;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.api.getEtablissements().subscribe({
      next: e => {
        const ownId = this.auth.getUserEtablissementId();
        this.etablissements = this.restrictToOwnEtablissement() ? e.filter(x => x.id === ownId) : [...e];
        this.cdr.detectChanges();
      }
    });
    this.api.getProgrammes().subscribe({ next: p => { this.programmes = [...p]; this.cdr.detectChanges(); } });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id && this.restrictToOwnEtablissement()) {
      this.form.patchValue({ etablissementCentreId: this.auth.getUserEtablissementId() ?? '' });
    }
    if (id) {
      this.isEdit = true;
      this.loading = true;
      this.api.getBeneficiaire(+id).subscribe({
        next: b => {
          this.form.patchValue(b);
          if (b.programmeId) {
            this.api.getPrestationsByProgramme(b.programmeId).subscribe(pr => {
              this.prestations = [...pr]; this.cdr.detectChanges();
            });
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.router.navigate(['/beneficiaires']); }
      });
    }
  }

  restrictToOwnEtablissement(): boolean {
    return this.auth.hasRole('ROLE_ASSISTANTE_SOCIALE');
  }

  buildForm() {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: [''],
      nomAr: ['', Validators.required],
      prenomAr: [''],
      alias: [''],
      cin: [''],
      numActeNaissance: [''],
      numPasseport: [''],
      numeroDossier: ['', Validators.required],
      typePieceIdentite: [''],
      sexe: [''],
      dateNaissance: [''],
      lieuNaissance: [''],
      nationalite: ['Marocaine'],
      adresse: [''],
      telephone: [''],
      visitesADomicile: [''],
      situationScolaire: [''],
      situationFamiliale: [''],
      temoignageFamille: [''],
      descriptionPhysique: [''],
      etatSantePsychique: [''],
      situationProfessionnelle: [''],
      sourceRevenu: [''],
      couvertureSociale: [''],
      revenuMensuel: [''],
      etatComportement: [''],
      description: [''],
      nomPere: [''],
      nomMere: [''],
      nomTuteur: [''],
      telephoneParent: [''],
      adresseParent: [''],
      situationDifficulte: [''],
      dateEntree: [''],
      dateSortie: [''],
      motifSortie: [''],
      etablissementCentreId: ['', Validators.required],
      programmeId: [''],
      prestationId: ['']
    });
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
    const request = this.isEdit
      ? this.api.updateBeneficiaire(+id!, this.form.value)
      : this.api.createBeneficiaire(this.form.value);

    request.subscribe({
      next: (b) => {
        this.snackBar.open(
          this.translate.instant(this.isEdit ? 'BENEFICIAIRE.FORM.UPDATED' : 'BENEFICIAIRE.FORM.CREATED'),
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/beneficiaires', b.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
