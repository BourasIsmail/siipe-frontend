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
import { AuthService } from '../../../core/auth/auth.service';
import { EtablissementCentre, Programme, Prestation } from '../../../core/models/etablissement.model';
import { SITUATIONS_DIFFICULTE } from '../../../core/models/beneficiaire.model';

@Component({
  selector: 'app-beneficiaire-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEdit ? 'Modifier' : 'Inscrire' }} un Bénéficiaire</h1>
      <button mat-button routerLink="/beneficiaires">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">

      <!-- Section 1: Inscription -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Inscription</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Visites à domicile</label>
              <select formControlName="visitesADomicile">
                <option value="">-- Sélectionner --</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div class="field">
              <label>Établissement *</label>
              <select formControlName="etablissementCentreId">
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
          </div>
          <div class="form-row">
            <div class="field">
              <label>Nom *</label>
              <input type="text" formControlName="nom" placeholder="Nom de famille">
              <span class="err" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Prénom</label>
              <input type="text" formControlName="prenom" placeholder="Prénom">
            </div>
            <div class="field">
              <label>Nom (Arabe) *</label>
              <input type="text" formControlName="nomAr" dir="rtl" placeholder="الاسم">
              <span class="err" *ngIf="form.get('nomAr')?.invalid && form.get('nomAr')?.touched">Champ requis</span>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Prénom (Arabe)</label>
              <input type="text" formControlName="prenomAr" dir="rtl" placeholder="النسب">
            </div>
            <div class="field">
              <label>Sexe</label>
              <select formControlName="sexe">
                <option value="">-- Sélectionner --</option>
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
              </select>
            </div>
            <div class="field">
              <label>Date d'accueil</label>
              <input type="date" formControlName="dateEntree">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Numéro de dossier *</label>
              <input type="text" formControlName="numeroDossier" placeholder="N° dossier">
              <span class="err" *ngIf="form.get('numeroDossier')?.invalid && form.get('numeroDossier')?.touched">Champ requis</span>
            </div>
            <div class="field">
              <label>Alias</label>
              <input type="text" formControlName="alias" placeholder="Alias">
            </div>
            <div class="field">
              <label>Nationalité</label>
              <input type="text" formControlName="nationalite" placeholder="Marocaine">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Date de naissance</label>
              <input type="date" formControlName="dateNaissance">
            </div>
            <div class="field">
              <label>Type de pièce d'identité</label>
              <select formControlName="typePieceIdentite">
                <option value="">-- Sélectionner --</option>
                <option value="Sans">Sans</option>
                <option value="CIN">CIN</option>
                <option value="Passeport">Passeport</option>
                <option value="Acte de naissance">Acte de naissance</option>
              </select>
            </div>
            <div class="field">
              <label>Numéro pièce d'identité</label>
              <input type="text" formControlName="cin" placeholder="Numéro">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Situation Scolaire</label>
              <select formControlName="situationScolaire">
                <option value="">-- Sélectionner --</option>
                <option value="Scolarisé">Scolarisé</option>
                <option value="Déscolarisé">Déscolarisé</option>
                <option value="Jamais scolarisé">Jamais scolarisé</option>
                <option value="Diplômé">Diplômé</option>
              </select>
            </div>
            <div class="field">
              <label>Situation familiale</label>
              <input type="text" formControlName="situationFamiliale" placeholder="Situation familiale">
            </div>
            <div class="field">
              <label>Témoignage de la famille</label>
              <input type="text" formControlName="temoignageFamille" placeholder="Témoignage">
            </div>
          </div>
          <div class="form-row">
            <div class="field" style="grid-column: span 2">
              <label>Description physique</label>
              <textarea formControlName="descriptionPhysique" rows="3" style="padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;width:100%"></textarea>
            </div>
            <div class="field">
              <label>État de santé psychique</label>
              <select formControlName="etatSantePsychique">
                <option value="">-- Sélectionner --</option>
                <option value="Sans troubles psychiques">Sans troubles psychiques</option>
                <option value="Avec troubles psychique">Avec troubles psychique</option>
                <option value="Suivi psychologique">Suivi psychologique</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Situation professionnelle</label>
              <select formControlName="situationProfessionnelle">
                <option value="">-- Sélectionner --</option>
                <option value="Élève">Élève</option>
                <option value="Étudiant">Étudiant</option>
                <option value="Sans emploi">Sans emploi</option>
                <option value="Employé">Employé</option>
                <option value="Travailleur informel">Travailleur informel</option>
                <option value="Retraité">Retraité</option>
              </select>
            </div>
            <div class="field">
              <label>Source de revenu</label>
              <input type="text" formControlName="sourceRevenu" placeholder="Source de revenu">
            </div>
            <div class="field">
              <label>Couverture sociale</label>
              <select formControlName="couvertureSociale">
                <option value="">-- Sélectionner --</option>
                <option value="Ramed">Ramed</option>
                <option value="CNSS">CNSS</option>
                <option value="CNOPS">CNOPS</option>
                <option value="Mutuelle">Mutuelle</option>
                <option value="Aucune">Aucune</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Revenu mensuel</label>
              <select formControlName="revenuMensuel">
                <option value="">-- Sélectionner --</option>
                <option value="Moins de 500">Moins de 500</option>
                <option value="500 - 1000">500 - 1000</option>
                <option value="1000 - 2000">1000 - 2000</option>
                <option value="2000 - 3000">2000 - 3000</option>
                <option value="Plus de 3000">Plus de 3000</option>
              </select>
            </div>
            <div class="field">
              <label>État de comportement/Moral</label>
              <select formControlName="etatComportement">
                <option value="">-- Sélectionner --</option>
                <option value="Stable">Stable</option>
                <option value="Agitation motrice">Agitation motrice</option>
                <option value="Agressivité">Agressivité</option>
                <option value="Dépression">Dépression</option>
                <option value="Anxiété">Anxiété</option>
              </select>
            </div>
            <div class="field">
              <label>Adresse</label>
              <input type="text" formControlName="adresse" placeholder="Adresse">
            </div>
          </div>
          <div class="form-row">
            <div class="field" style="grid-column: span 3">
              <label>Description</label>
              <textarea formControlName="description" rows="3" style="padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;width:100%"></textarea>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 2: Famille -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Famille</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Situation professionnelle parent</label>
              <input type="text" formControlName="nomPere" placeholder="Nom du père">
            </div>
            <div class="field">
              <label>Nom de la mère</label>
              <input type="text" formControlName="nomMere" placeholder="Nom de la mère">
            </div>
            <div class="field">
              <label>Nom du tuteur</label>
              <input type="text" formControlName="nomTuteur" placeholder="Nom du tuteur">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Téléphone parent/tuteur</label>
              <input type="text" formControlName="telephoneParent" placeholder="Téléphone">
            </div>
            <div class="field">
              <label>Adresse parent/tuteur</label>
              <input type="text" formControlName="adresseParent" placeholder="Adresse">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Situation de difficulté -->
      <mat-card class="mb-2">
        <mat-card-header><mat-card-title>Situation de difficulté</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <div class="field">
              <label>Situation de difficulté</label>
              <select formControlName="situationDifficulte">
                <option value="">-- Sélectionner --</option>
                <option *ngFor="let s of situations" [value]="s">{{ formatEnum(s) }}</option>
              </select>
            </div>
            <div class="field">
              <label>Date de sortie</label>
              <input type="date" formControlName="dateSortie">
            </div>
            <div class="field">
              <label>Motif de sortie</label>
              <input type="text" formControlName="motifSortie" placeholder="Motif">
            </div>
          </div>
          <div class="form-row">
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
        <button mat-button type="button" routerLink="/beneficiaires">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-right:8px"></mat-spinner>
          <span>{{ saving ? '' : (isEdit ? 'Enregistrer' : 'Inscrire') }}</span>
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
    private cdr: ChangeDetectorRef
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

  formatEnum(val: string): string {
    if (!val) return '-';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
          this.isEdit ? 'Bénéficiaire modifié' : 'Bénéficiaire inscrit',
          'OK', { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/beneficiaires', b.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}
