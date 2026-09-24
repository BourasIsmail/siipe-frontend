import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Beneficiaire, SituationMedicale, SituationSociale,
  SituationJudiciaire, DossierScolaire, Accompagnement,
  BesoinExprime, PrestationBeneficiaire
} from '../../../core/models/beneficiaire.model';
import { Programme, Prestation, EtablissementCentre } from '../../../core/models/etablissement.model';

@Component({
  selector: 'app-beneficiaire-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, TranslateModule
  ],
  template: `
    <div *ngIf="loading" class="flex-center" style="height:300px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <ng-container *ngIf="!loading && beneficiaire">

      <!-- Header -->
      <div class="detail-header">
        <div class="header-left">
          <div class="avatar-large" [style.background]="avatarColor">
            {{ beneficiaire.nom.charAt(0) }}{{ (beneficiaire.prenom || '').charAt(0) }}
          </div>
          <div>
            <h1>{{ beneficiaire.nom }} {{ beneficiaire.prenom }}</h1>
            <div class="nomAr" *ngIf="beneficiaire.nomAr">{{ beneficiaire.nomAr }} {{ beneficiaire.prenomAr }}</div>
            <div class="meta-row">
              <span class="badge badge-orange" *ngIf="beneficiaire.situationDifficulte">
                {{ formatEnum(beneficiaire.situationDifficulte) }}
              </span>
              <span class="text-secondary" *ngIf="beneficiaire.numeroDossier">{{ 'BENEFICIAIRE.DETAIL.NUMERO_PREFIX' | translate }} {{ beneficiaire.numeroDossier }}</span>
              <span class="text-secondary">{{ beneficiaire.sexe === 'MASCULIN' ? ('BENEFICIAIRE.MASCULIN' | translate) : beneficiaire.sexe === 'FEMININ' ? ('BENEFICIAIRE.FEMININ' | translate) : '' }}</span>
            </div>
            <div class="meta-row mt-1">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:#888">business</mat-icon>
              <span class="text-secondary">{{ beneficiaire.etablissementCentreNom || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/beneficiaires">
            <mat-icon>arrow_back</mat-icon> {{ 'COMMON.BACK' | translate }}
          </button>
          <button class="btn btn-outline" (click)="exportFiche()">
            <mat-icon>print</mat-icon> {{ 'BENEFICIAIRE.DETAIL.PDF' | translate }}
          </button>
          <a class="btn btn-primary" [routerLink]="['/beneficiaires', beneficiaire.id, 'edit']" *ngIf="canEdit()">
            <mat-icon>edit</mat-icon> {{ 'COMMON.EDIT' | translate }}
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab==='inscription'" (click)="activeTab='inscription'">{{ 'MENU.INSCRIPTION' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='famille'" (click)="activeTab='famille'">{{ 'BENEFICIAIRE.DETAIL.TAB_FAMILLE' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='besoin'" (click)="loadTab('besoin')">{{ 'BENEFICIAIRE.DETAIL.TAB_BESOIN' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='prestations'" (click)="loadTab('prestations')">{{ 'BENEFICIAIRE.DETAIL.TAB_PRESTATIONS' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='sociale'" (click)="loadTab('sociale')">{{ 'BENEFICIAIRE.TAB_SOCIALE' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='medicale'" (click)="loadTab('medicale')">{{ 'BENEFICIAIRE.TAB_MEDICAL' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='judiciaire'" (click)="loadTab('judiciaire')">{{ 'BENEFICIAIRE.TAB_JUDICIAIRE' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='dossier'" (click)="loadTab('dossier')">{{ 'BENEFICIAIRE.DETAIL.TAB_DOSSIER' | translate }}</button>
        <button class="tab" [class.active]="activeTab==='contact'" (click)="loadTab('contact')">{{ 'BENEFICIAIRE.DETAIL.TAB_CONTACT' | translate }}</button>
      </div>

      <!-- Tab: Inscription -->
      <mat-card *ngIf="activeTab==='inscription'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>{{ 'BENEFICIAIRE.DETAIL.SECTION_IDENTIFICATION' | translate }}</h3>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.NOM_COMPLET' | translate }}</span><strong>{{ beneficiaire.nom }} {{ beneficiaire.prenom }}</strong></div>
              <div class="info-row" *ngIf="beneficiaire.nomAr"><span>{{ 'BENEFICIAIRE.DETAIL.NOM_ARABE' | translate }}</span><strong dir="rtl">{{ beneficiaire.nomAr }} {{ beneficiaire.prenomAr }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.NUMERO_DOSSIER' | translate }}</span><strong>{{ beneficiaire.numeroDossier || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.ALIAS' | translate }}</span><strong>{{ beneficiaire.alias || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.SEXE' | translate }}</span><strong>{{ beneficiaire.sexe === 'MASCULIN' ? ('BENEFICIAIRE.MASCULIN' | translate) : beneficiaire.sexe === 'FEMININ' ? ('BENEFICIAIRE.FEMININ' | translate) : '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DATE_NAISSANCE' | translate }}</span><strong>{{ beneficiaire.dateNaissance ? (beneficiaire.dateNaissance | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.TYPE_PIECE_IDENTITE' | translate }}</span><strong>{{ beneficiaire.typePieceIdentite || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.NUMERO_PIECE_IDENTITE' | translate }}</span><strong>{{ beneficiaire.cin || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.NATIONALITE' | translate }}</span><strong>{{ beneficiaire.nationalite || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.ADRESSE' | translate }}</span><strong>{{ beneficiaire.adresse || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.TELEPHONE' | translate }}</span><strong>{{ beneficiaire.telephone || '-' }}</strong></div>
            </div>
            <div class="info-section">
              <h3>{{ 'BENEFICIAIRE.DETAIL.SECTION_PRISE_EN_CHARGE' | translate }}</h3>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }}</span><strong>{{ beneficiaire.etablissementCentreNom || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }}</span><strong>{{ beneficiaire.programmeNom || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }}</span><strong>{{ beneficiaire.prestationNom || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.DATE_ACCUEIL' | translate }}</span><strong>{{ beneficiaire.dateEntree ? (beneficiaire.dateEntree | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.DATE_SORTIE' | translate }}</span><strong>{{ beneficiaire.dateSortie ? (beneficiaire.dateSortie | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.MOTIF_SORTIE' | translate }}</span><strong>{{ beneficiaire.motifSortie || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.VISITES_A_DOMICILE' | translate }}</span><strong>{{ (beneficiaire.visitesADomicile ? 'COMMON.YES' : 'COMMON.NO') | translate }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.SITUATION' | translate }}</span><strong>{{ formatEnum(beneficiaire.situationDifficulte) }}</strong></div>
            </div>
            <div class="info-section">
              <h3>{{ 'BENEFICIAIRE.DETAIL.SECTION_SITUATION_PERSONNELLE' | translate }}</h3>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.SITUATION_SCOLAIRE_LABEL' | translate }}</span><strong>{{ beneficiaire.situationScolaire || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.SITUATION_FAMILIALE' | translate }}</span><strong>{{ beneficiaire.situationFamiliale || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.TEMOIGNAGE_FAMILLE' | translate }}</span><strong>{{ beneficiaire.temoignageFamille || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.ETAT_SANTE_PSYCHIQUE_LABEL' | translate }}</span><strong>{{ beneficiaire.etatSantePsychique || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL' | translate }}</span><strong>{{ beneficiaire.situationProfessionnelle || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.SOURCE_REVENU' | translate }}</span><strong>{{ beneficiaire.sourceRevenu || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL' | translate }}</span><strong>{{ beneficiaire.couvertureSociale || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL' | translate }}</span><strong>{{ beneficiaire.revenuMensuel || '-' }}</strong></div>
              <div class="info-row"><span>{{ 'BENEFICIAIRE.DETAIL.ETAT_COMPORTEMENT_LABEL' | translate }}</span><strong>{{ beneficiaire.etatComportement || '-' }}</strong></div>
            </div>
          </div>
          <div *ngIf="beneficiaire.descriptionPhysique || beneficiaire.description" style="margin-top:16px">
            <div *ngIf="beneficiaire.descriptionPhysique" class="obs-text"><strong>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE' | translate }}:</strong> {{ beneficiaire.descriptionPhysique }}</div>
            <div *ngIf="beneficiaire.description" class="obs-text" style="margin-top:8px"><strong>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}:</strong> {{ beneficiaire.description }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Famille -->
      <mat-card *ngIf="activeTab==='famille'" class="tab-card">
        <mat-card-content>
          <form (submit)="saveFamille($event)">
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.SITUATION_PROFESSIONNELLE_LABEL' | translate }}</label>
                <select [(ngModel)]="familleForm.situationProfessionnelle" name="sp">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Élève">{{ 'BENEFICIAIRE.OPTIONS.SITUATION_PROFESSIONNELLE.ELEVE' | translate }}</option>
                  <option value="Étudiant">{{ 'BENEFICIAIRE.DETAIL.SITUATION_PRO_ETUDIANT' | translate }}</option>
                  <option value="Sans emploi">{{ 'BENEFICIAIRE.DETAIL.SITUATION_PRO_SANS_EMPLOI' | translate }}</option>
                  <option value="Employé">{{ 'BENEFICIAIRE.DETAIL.SITUATION_PRO_EMPLOYE' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.SOURCE_REVENU' | translate }}</label>
                <input type="text" [(ngModel)]="familleForm.sourceRevenu" name="sr" [placeholder]="'BENEFICIAIRE.DETAIL.SOURCE_REVENU' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_SOCIALE_LABEL' | translate }}</label>
                <select [(ngModel)]="familleForm.couvertureSociale" name="cs">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Ramed">{{ 'BENEFICIAIRE.OPTIONS.COUVERTURE_SOCIALE.RAMED' | translate }}</option>
                  <option value="CNSS">{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_CNSS' | translate }}</option>
                  <option value="CNOPS">{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_CNOPS' | translate }}</option>
                  <option value="Aucune">{{ 'BENEFICIAIRE.DETAIL.COUVERTURE_AUCUNE' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.REVENU_MENSUEL_LABEL' | translate }}</label>
                <select [(ngModel)]="familleForm.revenuMensuel" name="rm">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Moins de 500">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.MOINS_500' | translate }}</option>
                  <option value="500 - 1000">{{ 'BENEFICIAIRE.DETAIL.REVENU_500_1000' | translate }}</option>
                  <option value="1000 - 2000">{{ 'BENEFICIAIRE.DETAIL.REVENU_1000_2000' | translate }}</option>
                  <option value="Plus de 2000">{{ 'BENEFICIAIRE.OPTIONS.REVENU_MENSUEL.PLUS_2000' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.TYPE_HABITAT' | translate }}</label>
                <input type="text" [(ngModel)]="familleForm.typeHabitat" name="th" [placeholder]="'BENEFICIAIRE.DETAIL.TYPE_HABITAT_PLACEHOLDER' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.NOMBRE_FRERES' | translate }}</label>
                <input type="number" [(ngModel)]="familleForm.nombreFreres" name="nf" placeholder="0">
              </div>
            </div>
            <div class="form-btns">
              <button type="submit" class="btn btn-primary">
                <mat-icon>save</mat-icon> {{ 'COMMON.SAVE' | translate }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Besoin exprimé -->
      <mat-card *ngIf="activeTab==='besoin'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'besoin'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVEAU_BESOIN' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.LIBELLE' | translate }}</label>
                <input type="text" [(ngModel)]="besoinForm.libelle" [placeholder]="'BENEFICIAIRE.DETAIL.LIBELLE' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }}</label>
                <select [(ngModel)]="besoinForm.programmeId" (change)="onProgrammeChangeBesoin($event)">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }}</label>
                <select [(ngModel)]="besoinForm.prestationId">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option *ngFor="let p of prestationsBesoin" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
            </div>
            <div class="field mb-2">
              <label>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}</label>
              <textarea [(ngModel)]="besoinForm.description" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveBesoin()">{{ 'COMMON.ADD' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.BESOIN_COUNT' | translate: { count: besoins.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('besoin')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && besoins.length > 0">
            <thead><tr><th>{{ 'BENEFICIAIRE.DETAIL.LIBELLE' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}</th></tr></thead>
            <tbody>
            <tr *ngFor="let b of besoins">
              <td>{{ b.libelle || '-' }}</td>
              <td>{{ b.programmeNom || '-' }}</td>
              <td>{{ b.prestationNom || '-' }}</td>
              <td>{{ b.description || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && besoins.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_BESOIN' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Mes prestations -->
      <mat-card *ngIf="activeTab==='prestations'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'prestation'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVELLE_PRESTATION' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }} *</label>
                <select [(ngModel)]="prestationForm.etablissementId">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }} *</label>
                <select [(ngModel)]="prestationForm.programmeId" (change)="onProgrammeChangePrestation($event)">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }} *</label>
                <select [(ngModel)]="prestationForm.prestationId">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option *ngFor="let p of prestationsPrestation" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.ORIENTATION' | translate }}</label>
                <select [(ngModel)]="prestationForm.orientation">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Service interne">{{ 'BENEFICIAIRE.DETAIL.SERVICE_INTERNE' | translate }}</option>
                  <option value="Service externe">{{ 'BENEFICIAIRE.DETAIL.SERVICE_EXTERNE' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.SERVICE_INTERNE' | translate }}</label>
                <input type="text" [(ngModel)]="prestationForm.serviceInterne" [placeholder]="'BENEFICIAIRE.DETAIL.SERVICE_PLACEHOLDER' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DATE_DEBUT' | translate }}</label>
                <input type="date" [(ngModel)]="prestationForm.dateDebut">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.STATUT_PRESTATION' | translate }}</label>
                <input type="text" [(ngModel)]="prestationForm.statutPrestation" [placeholder]="'BENEFICIAIRE.DETAIL.STATUT' | translate">
              </div>
              <div class="field" style="grid-column:span 2">
                <label>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION_PHYSIQUE' | translate }}</label>
                <textarea [(ngModel)]="prestationForm.descriptionPhysique" rows="2" class="textarea"></textarea>
              </div>
            </div>
            <div class="field mb-2">
              <label>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</label>
              <input type="file" #prestationFile style="padding:6px">
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="savePrestation(prestationFile)">{{ 'COMMON.ADD' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.PRESTATION_COUNT' | translate: { count: prestationsBeneficiaire.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('prestation')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && prestationsBeneficiaire.length > 0">
            <thead>
            <tr><th>{{ 'BENEFICIAIRE.ETABLISSEMENT' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PROGRAMME' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PRESTATION' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.ORIENTATION' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DATE_DEBUT' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.STATUT' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</th></tr>
            </thead>
            <tbody>
            <tr *ngFor="let p of prestationsBeneficiaire">
              <td>{{ p.etablissementNom || '-' }}</td>
              <td>{{ p.programmeNom || '-' }}</td>
              <td>{{ p.prestationNom || '-' }}</td>
              <td>{{ p.orientation || '-' }}</td>
              <td>{{ p.dateDebut ? (p.dateDebut | date:'dd/MM/yyyy') : '-' }}</td>
              <td>{{ p.statutPrestation || '-' }}</td>
              <td>
                <a *ngIf="p.pieceJointeUrl" [href]="getFileUrl(p.pieceJointeUrl)" target="_blank" class="action-btn" [title]="'COMMON.VIEW' | translate">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" [title]="'BENEFICIAIRE.DETAIL.UPLOAD' | translate" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadPieceJointePrestation($event, p.id!)">
                </label>
              </td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && prestationsBeneficiaire.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_PRESTATION' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation sociale -->
      <mat-card *ngIf="activeTab==='sociale'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'sociale'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_SOCIALE' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.SITUATION' | translate }}</label>
                <select [(ngModel)]="socialeForm.situationDifficulte">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Victime de violence">{{ 'DICT.VICTIME_DE_VIOLENCE' | translate }}</option>
                  <option value="Abandon">{{ 'BENEFICIAIRE.DETAIL.ABANDON' | translate }}</option>
                  <option value="Négligence">{{ 'BENEFICIAIRE.DETAIL.NEGLIGENCE' | translate }}</option>
                  <option value="Exploitation">{{ 'BENEFICIAIRE.DETAIL.EXPLOITATION' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.TYPE_VIOLENCE' | translate }}</label>
                <input type="text" [(ngModel)]="socialeForm.typeViolence" [placeholder]="'BENEFICIAIRE.DETAIL.TYPE_LABEL' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DEGRE' | translate }}</label>
                <input type="text" [(ngModel)]="socialeForm.degre" [placeholder]="'BENEFICIAIRE.DETAIL.DEGRE' | translate">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.SOURCE_VIOLENCE' | translate }}</label>
                <input type="text" [(ngModel)]="socialeForm.sourceViolence" [placeholder]="'BENEFICIAIRE.DETAIL.SOURCE' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.LIEU_VIOLENCE' | translate }}</label>
                <input type="text" [(ngModel)]="socialeForm.lieuViolence" [placeholder]="'BENEFICIAIRE.DETAIL.LIEU' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DATE_VIOLENCE' | translate }}</label>
                <input type="date" [(ngModel)]="socialeForm.dateViolence">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.VIOLENCE_REPETEE' | translate }}</label>
                <input type="text" [(ngModel)]="socialeForm.violenceRepetee" [placeholder]="'BENEFICIAIRE.DETAIL.OUI_NON_PLACEHOLDER' | translate">
              </div>
              <div class="field" style="grid-column:span 2">
                <label>{{ 'BENEFICIAIRE.DETAIL.OBSERVATION' | translate }}</label>
                <textarea [(ngModel)]="socialeForm.observation" rows="3" class="textarea"></textarea>
              </div>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveSociale()">{{ 'COMMON.ADD' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.REGISTRATION_COUNT' | translate: { count: situationsSociales.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('sociale')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsSociales.length > 0">
            <thead><tr><th>{{ 'BENEFICIAIRE.DETAIL.SITUATION_LABEL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.TYPE_VIOLENCE_COL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.LIEU' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.OBSERVATION' | translate }}</th></tr></thead>
            <tbody>
            <tr *ngFor="let s of situationsSociales">
              <td>{{ s.situationDifficulte || '-' }}</td>
              <td>{{ s.typeViolence || '-' }}</td>
              <td>{{ s.lieuViolence || '-' }}</td>
              <td>{{ s.dateViolence ? (s.dateViolence | date:'dd/MM/yyyy') : '-' }}</td>
              <td>{{ s.observation || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && situationsSociales.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_SOCIALE' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation Médicale -->
      <mat-card *ngIf="activeTab==='medicale'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'medicale'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_MEDICALE' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.TAB_MEDICAL' | translate }}</label>
                <select [(ngModel)]="medicaleForm.situationMedicale">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Physique">{{ 'DICT.PHYSIQUE' | translate }}</option>
                  <option value="Psychique">{{ 'DICT.PSYCHIQUE' | translate }}</option>
                  <option value="Chronique">{{ 'BENEFICIAIRE.DETAIL.SITUATION_MEDICALE_CHRONIQUE' | translate }}</option>
                  <option value="Handicap">{{ 'BENEFICIAIRE.DETAIL.SITUATION_MEDICALE_HANDICAP' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.HISTORIQUE_MEDICALE' | translate }}</label>
                <input type="text" [(ngModel)]="medicaleForm.historiqueMedicale" [placeholder]="'BENEFICIAIRE.DETAIL.HISTORIQUE' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.MEDECIN' | translate }}</label>
                <input type="text" [(ngModel)]="medicaleForm.medecin" [placeholder]="'BENEFICIAIRE.DETAIL.NOM_MEDECIN' | translate">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.UTILISATION_MEDICAMENT' | translate }}</label>
                <select [(ngModel)]="medicaleForm.utilisationMedicament">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Oui">{{ 'COMMON.YES' | translate }}</option>
                  <option value="Non">{{ 'COMMON.NO' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</label>
                <input type="date" [(ngModel)]="medicaleForm.date">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.CERTIFICAT_FICHIER' | translate }}</label>
                <input type="file" #certificatFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>{{ 'BENEFICIAIRE.DETAIL.OBSERVATION' | translate }}</label>
              <textarea [(ngModel)]="medicaleForm.observation" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveMedicale(certificatFile)">{{ 'COMMON.SAVE' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.REGISTRATION_COUNT' | translate: { count: situationsMedicales.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('medicale')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsMedicales.length > 0">
            <thead>
            <tr><th>{{ 'BENEFICIAIRE.TAB_MEDICAL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.HISTORIQUE' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.MEDECIN' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.MEDICAMENT' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.CERTIFICAT' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.OBSERVATION' | translate }}</th></tr>
            </thead>
            <tbody>
            <tr *ngFor="let s of situationsMedicales">
              <td>{{ s.situationMedicale || '-' }}</td>
              <td>{{ s.historiqueMedicale || '-' }}</td>
              <td>{{ s.medecin || '-' }}</td>
              <td>{{ s.utilisationMedicament || '-' }}</td>
              <td>
                <a *ngIf="s.certificatUrl" [href]="getFileUrl(s.certificatUrl)" target="_blank" class="action-btn" [title]="'COMMON.VIEW' | translate">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" [title]="'BENEFICIAIRE.DETAIL.UPLOAD' | translate" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadCertificatMedical($event, s.id!)">
                </label>
              </td>
              <td>{{ s.observation || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && situationsMedicales.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_MEDICALE' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation Judiciaire -->
      <mat-card *ngIf="activeTab==='judiciaire'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'judiciaire'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVELLE_SITUATION_JUDICIAIRE' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PEINE' | translate }}</label>
                <select [(ngModel)]="judiciaireForm.peine">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Peines criminelles">{{ 'BENEFICIAIRE.DETAIL.PEINES_CRIMINELLES' | translate }}</option>
                  <option value="Peines correctionnelles">{{ 'BENEFICIAIRE.DETAIL.PEINES_CORRECTIONNELLES' | translate }}</option>
                  <option value="Peines de police">{{ 'BENEFICIAIRE.DETAIL.PEINES_DE_POLICE' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PEINES_CRIMINELLES' | translate }}</label>
                <select [(ngModel)]="judiciaireForm.peinesCriminelles">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Peine de mort">{{ 'DICT.PEINE_DE_MORT' | translate }}</option>
                  <option value="Réclusion criminelle">{{ 'BENEFICIAIRE.DETAIL.RECLUSION_CRIMINELLE' | translate }}</option>
                  <option value="Détention criminelle">{{ 'BENEFICIAIRE.DETAIL.DETENTION_CRIMINELLE' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DUREE_MOIS' | translate }}</label>
                <input type="text" [(ngModel)]="judiciaireForm.duree" [placeholder]="'BENEFICIAIRE.DETAIL.DUREE' | translate">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.LIEUX' | translate }}</label>
                <input type="text" [(ngModel)]="judiciaireForm.lieux" [placeholder]="'BENEFICIAIRE.DETAIL.LIEU' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</label>
                <input type="date" [(ngModel)]="judiciaireForm.date">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</label>
                <input type="file" #judiciaireFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}</label>
              <textarea [(ngModel)]="judiciaireForm.description" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveJudiciaire(judiciaireFile)">{{ 'COMMON.ADD' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.REGISTRATION_COUNT' | translate: { count: situationsJudiciaires.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('judiciaire')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsJudiciaires.length > 0">
            <thead><tr><th>{{ 'BENEFICIAIRE.DETAIL.LIEUX' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DUREE' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DESCRIPTION' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</th></tr></thead>
            <tbody>
            <tr *ngFor="let s of situationsJudiciaires">
              <td>{{ s.lieux || '-' }}</td>
              <td>{{ s.date ? (s.date | date:'dd/MM/yyyy') : '-' }}</td>
              <td>{{ s.duree || '-' }}</td>
              <td>{{ s.description || '-' }}</td>
              <td>
                <a *ngIf="s.pieceJointeUrl" [href]="getFileUrl(s.pieceJointeUrl)" target="_blank" class="action-btn">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadPieceJointeJudiciaire($event, s.id!)">
                </label>
              </td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && situationsJudiciaires.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_JUDICIAIRE' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Dossier -->
      <mat-card *ngIf="activeTab==='dossier'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'dossier'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVEAU_DOSSIER' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.TYPE_LABEL' | translate }}</label>
                <select [(ngModel)]="dossierForm.type">
                  <option value="">{{ 'BENEFICIAIRE.DETAIL.SELECT_PLACEHOLDER' | translate }}</option>
                  <option value="Médicale">{{ 'DICT.MEDICALE' | translate }}</option>
                  <option value="Scolaire">{{ 'DICT.SCOLAIRE' | translate }}</option>
                  <option value="Judiciaire">{{ 'BENEFICIAIRE.DETAIL.TYPE_JUDICIAIRE' | translate }}</option>
                  <option value="Social">{{ 'BENEFICIAIRE.DETAIL.TYPE_SOCIAL' | translate }}</option>
                </select>
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</label>
                <input type="date" [(ngModel)]="dossierForm.date">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</label>
                <input type="file" #dossierFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>{{ 'BENEFICIAIRE.DETAIL.DECISIONS' | translate }}</label>
              <textarea [(ngModel)]="dossierForm.decisions" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveDossier(dossierFile)">{{ 'COMMON.ADD' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.DOSSIER_COUNT' | translate: { count: dossiers.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('dossier')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && dossiers.length > 0">
            <thead><tr><th>{{ 'BENEFICIAIRE.DETAIL.DATE_LABEL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.TYPE_LABEL' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.DECISIONS' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.PIECE_JOINTE' | translate }}</th></tr></thead>
            <tbody>
            <tr *ngFor="let d of dossiers">
              <td>{{ d.date ? (d.date | date:'dd/MM/yyyy') : '-' }}</td>
              <td>{{ d.type || '-' }}</td>
              <td>{{ d.decisions || '-' }}</td>
              <td>
                <a *ngIf="d.pieceJointeUrl" [href]="getFileUrl(d.pieceJointeUrl)" target="_blank" class="action-btn">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadPieceJointeDossier($event, d.id!)">
                </label>
              </td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && dossiers.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_DOSSIER' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Contact -->
      <mat-card *ngIf="activeTab==='contact'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'contact'" class="add-form">
            <h4>{{ 'BENEFICIAIRE.DETAIL.NOUVEAU_CONTACT' | translate }}</h4>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.PRECISER_ACCOMPAGNEMENT' | translate }}</label>
                <input type="text" [(ngModel)]="contactForm.preciserAccompagnement" [placeholder]="'BENEFICIAIRE.DETAIL.TYPE_LABEL' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.NOM' | translate }}</label>
                <input type="text" [(ngModel)]="contactForm.nomAccompagnement" [placeholder]="'BENEFICIAIRE.NOM' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.PRENOM' | translate }}</label>
                <input type="text" [(ngModel)]="contactForm.prenomAccompagnement" [placeholder]="'BENEFICIAIRE.PRENOM' | translate">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.ADRESSE' | translate }}</label>
                <input type="text" [(ngModel)]="contactForm.adresseAccompagnement" [placeholder]="'BENEFICIAIRE.DETAIL.ADRESSE' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.TELEPHONE' | translate }}</label>
                <input type="text" [(ngModel)]="contactForm.telephoneAccompagnement" [placeholder]="'BENEFICIAIRE.DETAIL.TELEPHONE' | translate">
              </div>
              <div class="field">
                <label>{{ 'BENEFICIAIRE.DETAIL.EMAIL' | translate }}</label>
                <input type="email" [(ngModel)]="contactForm.emailAccompagnement" [placeholder]="'BENEFICIAIRE.DETAIL.EMAIL' | translate">
              </div>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">{{ 'COMMON.CANCEL' | translate }}</button>
              <button class="btn btn-primary" (click)="saveContact()">{{ 'COMMON.SAVE' | translate }}</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ 'BENEFICIAIRE.DETAIL.CONTACT_COUNT' | translate: { count: accompagnements.length } }}</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('contact')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> {{ 'COMMON.ADD' | translate }}
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && accompagnements.length > 0">
            <thead><tr><th>{{ 'BENEFICIAIRE.TAB_ACCOMPAGNEMENT' | translate }}</th><th>{{ 'BENEFICIAIRE.NOM' | translate }}</th><th>{{ 'BENEFICIAIRE.PRENOM' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.TELEPHONE' | translate }}</th><th>{{ 'BENEFICIAIRE.DETAIL.EMAIL' | translate }}</th></tr></thead>
            <tbody>
            <tr *ngFor="let a of accompagnements">
              <td>{{ a.preciserAccompagnement || '-' }}</td>
              <td>{{ a.nomAccompagnement || '-' }}</td>
              <td>{{ a.prenomAccompagnement || '-' }}</td>
              <td>{{ a.telephoneAccompagnement || '-' }}</td>
              <td>{{ a.emailAccompagnement || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && accompagnements.length === 0" class="empty-tab">{{ 'BENEFICIAIRE.DETAIL.EMPTY_CONTACT' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <div class="audit-info">
        <span>{{ 'BENEFICIAIRE.DETAIL.CREATED_BY' | translate: { name: beneficiaire.createdBy, date: (beneficiaire.createdAt | date:'dd/MM/yyyy') } }}</span>
      </div>

    </ng-container>
  `,
  styles: [`
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .avatar-large { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; flex-shrink: 0; }
    h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 4px; }
    .nomAr { font-size: 15px; color: #888; direction: rtl; margin-bottom: 6px; }
    .meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mt-1 { margin-top: 6px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 6px; font-size: 14px; font-family: inherit; cursor: pointer; text-decoration: none; border: none; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-outline { background: white; color: #555; border: 1px solid #ccc; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-orange { background: #fff3e0; color: #e65100; }
    .tabs { display: flex; gap: 2px; margin-bottom: 16px; border-bottom: 2px solid #e0e0e0; overflow-x: auto; }
    .tab { padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: #666; white-space: nowrap; border-bottom: 3px solid transparent; margin-bottom: -2px; font-family: inherit; border-radius: 4px 4px 0 0; }
    .tab:hover { background: #f5f5f5; color: var(--color-primary); }
    .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
    .tab-card { border-radius: 0 8px 8px 8px !important; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
    .info-section h3 { color: var(--color-primary); font-size: 14px; font-weight: 600; border-bottom: 1px solid #e8f5e9; padding-bottom: 8px; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #fafafa; font-size: 14px; }
    .info-row span { color: #666; }
    .info-row strong { color: #333; text-align: right; max-width: 60%; }
    .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .add-form { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e0e0e0; }
    .add-form h4 { color: var(--color-primary); margin-bottom: 16px; font-size: 15px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 12px; font-weight: 500; color: #666; }
    .field input, .field select { padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; font-family: inherit; background: white; height: 38px; }
    .field input:focus, .field select:focus { outline: none; border-color: var(--color-primary); }
    .textarea { padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; font-family: inherit; width: 100%; resize: vertical; }
    .mb-2 { margin-bottom: 12px; }
    .form-btns { display: flex; justify-content: flex-end; gap: 8px; }
    .obs-text { font-size: 13px; color: #666; padding: 8px; background: #f9f9f9; border-radius: 4px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th { background: var(--color-primary); color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9f9; }
    .action-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: var(--color-primary); text-decoration: none; }
    .action-btn:hover { background: #e8f5e9; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-tab { text-align: center; padding: 40px; color: #bbb; font-size: 14px; }
    .audit-info { margin-top: 16px; font-size: 12px; color: #bbb; text-align: right; padding-bottom: 32px; }
  `]
})
export class BeneficiaireDetailComponent implements OnInit {
  beneficiaire: Beneficiaire | null = null;
  loading = true;
  loadingTab = false;
  activeTab = 'inscription';
  addingForm = '';
  avatarColor = '#2e7d32';

  situationsMedicales: SituationMedicale[] = [];
  situationsSociales: SituationSociale[] = [];
  situationsJudiciaires: SituationJudiciaire[] = [];
  dossiers: DossierScolaire[] = [];
  accompagnements: Accompagnement[] = [];
  besoins: BesoinExprime[] = [];
  prestationsBeneficiaire: PrestationBeneficiaire[] = [];
  programmes: Programme[] = [];
  prestationsBesoin: Prestation[] = [];
  prestationsPrestation: Prestation[] = [];
  etablissements: EtablissementCentre[] = [];
  loadedTabs: Set<string> = new Set();

  familleForm: any = {};
  medicaleForm: any = {};
  socialeForm: any = {};
  judiciaireForm: any = {};
  dossierForm: any = {};
  contactForm: any = {};
  besoinForm: any = {};
  prestationForm: any = {};

  readonly avatarColors = ['#2e7d32','#1565c0','#6a1b9a','#e65100','#00838f'];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.getBeneficiaire(+id).subscribe({
      next: b => {
        this.beneficiaire = b;
        const idx = (b.nom.charCodeAt(0)) % this.avatarColors.length;
        this.avatarColor = this.avatarColors[idx];
        this.familleForm = {
          situationProfessionnelle: b.situationProfessionnelle || '',
          sourceRevenu: b.sourceRevenu || '',
          couvertureSociale: b.couvertureSociale || '',
          revenuMensuel: b.revenuMensuel || '',
          typeHabitat: '',
          nombreFreres: null
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
    this.api.getProgrammes().subscribe(p => { this.programmes = p; this.cdr.detectChanges(); });
    this.api.getEtablissements().subscribe(e => { this.etablissements = e; this.cdr.detectChanges(); });
  }

  loadTab(tab: string) {
    this.activeTab = tab;
    this.addingForm = '';
    if (this.loadedTabs.has(tab) || !this.beneficiaire) return;
    this.loadingTab = true;
    const id = this.beneficiaire.id;
    const done = () => { this.loadingTab = false; this.loadedTabs.add(tab); this.cdr.detectChanges(); };

    switch (tab) {
      case 'medicale': this.api.getSituationsMedicales(id).subscribe(d => { this.situationsMedicales = d; done(); }, () => done()); break;
      case 'sociale': this.api.getSituationsSociales(id).subscribe(d => { this.situationsSociales = d; done(); }, () => done()); break;
      case 'judiciaire': this.api.getSituationsJudiciaires(id).subscribe(d => { this.situationsJudiciaires = d; done(); }, () => done()); break;
      case 'dossier': this.api.getDossiersScolaires(id).subscribe(d => { this.dossiers = d; done(); }, () => done()); break;
      case 'contact': this.api.getAccompagnements(id).subscribe(d => { this.accompagnements = d; done(); }, () => done()); break;
      case 'besoin': this.api.getBesoins(id).subscribe(d => { this.besoins = d; done(); }, () => done()); break;
      case 'prestations': this.api.getPrestationsBeneficiaire(id).subscribe(d => { this.prestationsBeneficiaire = d; done(); }, () => done()); break;
    }
  }

  showAddForm(type: string) {
    this.addingForm = type;
    this.medicaleForm = {};
    this.socialeForm = {};
    this.judiciaireForm = {};
    this.dossierForm = {};
    this.contactForm = {};
    this.besoinForm = {};
    this.prestationForm = {};
    this.prestationsBesoin = [];
    this.prestationsPrestation = [];
  }

  onProgrammeChangeBesoin(event: any) {
    const programmeId = event.target?.value;
    if (!programmeId) { this.prestationsBesoin = []; return; }
    this.api.getPrestationsByProgramme(+programmeId).subscribe({
      next: p => { this.prestationsBesoin = [...p]; this.cdr.detectChanges(); }
    });
  }

  onProgrammeChangePrestation(event: any) {
    const programmeId = event.target?.value;
    if (!programmeId) { this.prestationsPrestation = []; return; }
    this.api.getPrestationsByProgramme(+programmeId).subscribe({
      next: p => { this.prestationsPrestation = [...p]; this.cdr.detectChanges(); }
    });
  }

  saveFamille(e: Event) {
    e.preventDefault();
    if (!this.beneficiaire) return;
    this.api.updateBeneficiaire(this.beneficiaire.id, { ...this.beneficiaire, ...this.familleForm }).subscribe({
      next: b => { this.beneficiaire = b; this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveMedicale(fileInput: HTMLInputElement) {
    this.api.addSituationMedicale(this.beneficiaire!.id, this.medicaleForm).subscribe({
      next: s => {
        this.situationsMedicales.unshift(s);
        if (fileInput.files && fileInput.files[0]) {
          this.api.uploadCertificatMedical(this.beneficiaire!.id, s.id!, fileInput.files[0]).subscribe({
            next: updated => { this.situationsMedicales = this.situationsMedicales.map(x => x.id === updated.id ? updated : x); this.cdr.detectChanges(); }
          });
        }
        this.addingForm = ''; this.medicaleForm = {}; this.cdr.detectChanges();
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveSociale() {
    this.api.addSituationSociale(this.beneficiaire!.id, this.socialeForm).subscribe({
      next: s => { this.situationsSociales.unshift(s); this.addingForm = ''; this.socialeForm = {}; this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveJudiciaire(fileInput: HTMLInputElement) {
    this.api.addSituationJudiciaire(this.beneficiaire!.id, this.judiciaireForm).subscribe({
      next: s => {
        this.situationsJudiciaires.unshift(s);
        if (fileInput.files && fileInput.files[0]) {
          this.api.uploadPieceJointeJudiciaire(this.beneficiaire!.id, s.id!, fileInput.files[0]).subscribe({
            next: updated => { this.situationsJudiciaires = this.situationsJudiciaires.map(x => x.id === updated.id ? updated : x); this.cdr.detectChanges(); }
          });
        }
        this.addingForm = ''; this.judiciaireForm = {}; this.cdr.detectChanges();
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveDossier(fileInput: HTMLInputElement) {
    this.api.addDossierScolaire(this.beneficiaire!.id, this.dossierForm).subscribe({
      next: d => {
        this.dossiers.unshift(d);
        if (fileInput.files && fileInput.files[0]) {
          this.api.uploadPieceJointeDossier(this.beneficiaire!.id, d.id!, fileInput.files[0]).subscribe({
            next: updated => { this.dossiers = this.dossiers.map(x => x.id === updated.id ? updated : x); this.cdr.detectChanges(); }
          });
        }
        this.addingForm = ''; this.dossierForm = {}; this.cdr.detectChanges();
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveContact() {
    this.api.addAccompagnement(this.beneficiaire!.id, this.contactForm).subscribe({
      next: a => { this.accompagnements.unshift(a); this.addingForm = ''; this.contactForm = {}; this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  saveBesoin() {
    this.api.addBesoin(this.beneficiaire!.id, this.besoinForm).subscribe({
      next: b => { this.besoins.unshift(b); this.addingForm = ''; this.besoinForm = {}; this.prestationsBesoin = []; this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  savePrestation(fileInput: HTMLInputElement) {
    this.api.addPrestationBeneficiaire(this.beneficiaire!.id, this.prestationForm).subscribe({
      next: p => {
        this.prestationsBeneficiaire.unshift(p);
        if (fileInput.files && fileInput.files[0]) {
          this.api.uploadPieceJointePrestation(this.beneficiaire!.id, p.id!, fileInput.files[0]).subscribe({
            next: updated => { this.prestationsBeneficiaire = this.prestationsBeneficiaire.map(x => x.id === updated.id ? updated : x); this.cdr.detectChanges(); }
          });
        }
        this.addingForm = ''; this.prestationForm = {}; this.prestationsPrestation = []; this.cdr.detectChanges();
        this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.SAVED'), 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open(this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  uploadCertificatMedical(event: any, situationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadCertificatMedical(this.beneficiaire!.id, situationId, file).subscribe({
      next: s => { this.situationsMedicales = this.situationsMedicales.map(x => x.id === s.id ? s : x); this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.UPLOADED_CERTIFICAT'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.ERROR_UPLOAD'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  uploadPieceJointeJudiciaire(event: any, situationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointeJudiciaire(this.beneficiaire!.id, situationId, file).subscribe({
      next: s => { this.situationsJudiciaires = this.situationsJudiciaires.map(x => x.id === s.id ? s : x); this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.UPLOADED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.ERROR_UPLOAD'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  uploadPieceJointeDossier(event: any, dossierId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointeDossier(this.beneficiaire!.id, dossierId, file).subscribe({
      next: d => { this.dossiers = this.dossiers.map(x => x.id === d.id ? d : x); this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.UPLOADED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.ERROR_UPLOAD'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  uploadPieceJointePrestation(event: any, prestationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointePrestation(this.beneficiaire!.id, prestationId, file).subscribe({
      next: p => { this.prestationsBeneficiaire = this.prestationsBeneficiaire.map(x => x.id === p.id ? p : x); this.cdr.detectChanges(); this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.UPLOADED'), 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open(this.translate.instant('BENEFICIAIRE.DETAIL.ERROR_UPLOAD'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 })
    });
  }

  exportFiche() {
    this.api.exportBeneficiaireFiche(this.beneficiaire!.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `fiche-${this.beneficiaire!.nom}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  getFileUrl(path: string): string { return `http://localhost:8080/api/files?path=${path}`; }

  formatEnum(val: string | undefined): string {
    if (!val) return '-';
    return this.translate.instant('BENEFICIAIRE.OPTIONS.SITUATION_DIFFICULTE.' + val);
  }

  canEdit() { return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']); }
}
