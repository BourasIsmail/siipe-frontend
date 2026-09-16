import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatProgressSpinnerModule, MatSnackBarModule
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
              <span class="text-secondary" *ngIf="beneficiaire.numeroDossier">N° {{ beneficiaire.numeroDossier }}</span>
              <span class="text-secondary">{{ beneficiaire.sexe === 'MASCULIN' ? 'Masculin' : beneficiaire.sexe === 'FEMININ' ? 'Féminin' : '' }}</span>
            </div>
            <div class="meta-row mt-1">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:#888">business</mat-icon>
              <span class="text-secondary">{{ beneficiaire.etablissementCentreNom || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/beneficiaires">
            <mat-icon>arrow_back</mat-icon> Retour
          </button>
          <button class="btn btn-outline" (click)="exportFiche()">
            <mat-icon>print</mat-icon> PDF
          </button>
          <a class="btn btn-primary" [routerLink]="['/beneficiaires', beneficiaire.id, 'edit']" *ngIf="canEdit()">
            <mat-icon>edit</mat-icon> Modifier
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab==='inscription'" (click)="activeTab='inscription'">Inscription</button>
        <button class="tab" [class.active]="activeTab==='famille'" (click)="activeTab='famille'">Famille</button>
        <button class="tab" [class.active]="activeTab==='besoin'" (click)="loadTab('besoin')">Besoin exprimé</button>
        <button class="tab" [class.active]="activeTab==='prestations'" (click)="loadTab('prestations')">Mes prestations</button>
        <button class="tab" [class.active]="activeTab==='sociale'" (click)="loadTab('sociale')">Situation sociale</button>
        <button class="tab" [class.active]="activeTab==='medicale'" (click)="loadTab('medicale')">Situation Médicale</button>
        <button class="tab" [class.active]="activeTab==='judiciaire'" (click)="loadTab('judiciaire')">Situation Judiciaire</button>
        <button class="tab" [class.active]="activeTab==='dossier'" (click)="loadTab('dossier')">Dossier</button>
        <button class="tab" [class.active]="activeTab==='contact'" (click)="loadTab('contact')">Contact</button>
      </div>

      <!-- Tab: Inscription -->
      <mat-card *ngIf="activeTab==='inscription'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>Identification</h3>
              <div class="info-row"><span>Nom complet</span><strong>{{ beneficiaire.nom }} {{ beneficiaire.prenom }}</strong></div>
              <div class="info-row" *ngIf="beneficiaire.nomAr"><span>Nom (Arabe)</span><strong dir="rtl">{{ beneficiaire.nomAr }} {{ beneficiaire.prenomAr }}</strong></div>
              <div class="info-row"><span>N° Dossier</span><strong>{{ beneficiaire.numeroDossier || '-' }}</strong></div>
              <div class="info-row"><span>Alias</span><strong>{{ beneficiaire.alias || '-' }}</strong></div>
              <div class="info-row"><span>Sexe</span><strong>{{ beneficiaire.sexe === 'MASCULIN' ? 'Masculin' : beneficiaire.sexe === 'FEMININ' ? 'Féminin' : '-' }}</strong></div>
              <div class="info-row"><span>Date de naissance</span><strong>{{ beneficiaire.dateNaissance ? (beneficiaire.dateNaissance | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>Type pièce identité</span><strong>{{ beneficiaire.typePieceIdentite || '-' }}</strong></div>
              <div class="info-row"><span>N° Pièce identité</span><strong>{{ beneficiaire.cin || '-' }}</strong></div>
              <div class="info-row"><span>Nationalité</span><strong>{{ beneficiaire.nationalite || '-' }}</strong></div>
              <div class="info-row"><span>Adresse</span><strong>{{ beneficiaire.adresse || '-' }}</strong></div>
              <div class="info-row"><span>Téléphone</span><strong>{{ beneficiaire.telephone || '-' }}</strong></div>
            </div>
            <div class="info-section">
              <h3>Prise en charge</h3>
              <div class="info-row"><span>Établissement</span><strong>{{ beneficiaire.etablissementCentreNom || '-' }}</strong></div>
              <div class="info-row"><span>Programme</span><strong>{{ beneficiaire.programmeNom || '-' }}</strong></div>
              <div class="info-row"><span>Prestation</span><strong>{{ beneficiaire.prestationNom || '-' }}</strong></div>
              <div class="info-row"><span>Date d'accueil</span><strong>{{ beneficiaire.dateEntree ? (beneficiaire.dateEntree | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>Date de sortie</span><strong>{{ beneficiaire.dateSortie ? (beneficiaire.dateSortie | date:'dd/MM/yyyy') : '-' }}</strong></div>
              <div class="info-row"><span>Motif sortie</span><strong>{{ beneficiaire.motifSortie || '-' }}</strong></div>
              <div class="info-row"><span>Visites à domicile</span><strong>{{ beneficiaire.visitesADomicile ? 'Oui' : 'Non' }}</strong></div>
              <div class="info-row"><span>Situation difficulté</span><strong>{{ formatEnum(beneficiaire.situationDifficulte) }}</strong></div>
            </div>
            <div class="info-section">
              <h3>Situation personnelle</h3>
              <div class="info-row"><span>Situation scolaire</span><strong>{{ beneficiaire.situationScolaire || '-' }}</strong></div>
              <div class="info-row"><span>Situation familiale</span><strong>{{ beneficiaire.situationFamiliale || '-' }}</strong></div>
              <div class="info-row"><span>Témoignage famille</span><strong>{{ beneficiaire.temoignageFamille || '-' }}</strong></div>
              <div class="info-row"><span>État santé psychique</span><strong>{{ beneficiaire.etatSantePsychique || '-' }}</strong></div>
              <div class="info-row"><span>Situation professionnelle</span><strong>{{ beneficiaire.situationProfessionnelle || '-' }}</strong></div>
              <div class="info-row"><span>Source de revenu</span><strong>{{ beneficiaire.sourceRevenu || '-' }}</strong></div>
              <div class="info-row"><span>Couverture sociale</span><strong>{{ beneficiaire.couvertureSociale || '-' }}</strong></div>
              <div class="info-row"><span>Revenu mensuel</span><strong>{{ beneficiaire.revenuMensuel || '-' }}</strong></div>
              <div class="info-row"><span>État comportement</span><strong>{{ beneficiaire.etatComportement || '-' }}</strong></div>
            </div>
          </div>
          <div *ngIf="beneficiaire.descriptionPhysique || beneficiaire.description" style="margin-top:16px">
            <div *ngIf="beneficiaire.descriptionPhysique" class="obs-text"><strong>Description physique:</strong> {{ beneficiaire.descriptionPhysique }}</div>
            <div *ngIf="beneficiaire.description" class="obs-text" style="margin-top:8px"><strong>Description:</strong> {{ beneficiaire.description }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Famille -->
      <mat-card *ngIf="activeTab==='famille'" class="tab-card">
        <mat-card-content>
          <form (submit)="saveFamille($event)">
            <div class="form-row">
              <div class="field">
                <label>Situation professionnelle</label>
                <select [(ngModel)]="familleForm.situationProfessionnelle" name="sp">
                  <option value="">-- Sélectionner --</option>
                  <option value="Élève">Élève</option>
                  <option value="Étudiant">Étudiant</option>
                  <option value="Sans emploi">Sans emploi</option>
                  <option value="Employé">Employé</option>
                </select>
              </div>
              <div class="field">
                <label>Source de revenu</label>
                <input type="text" [(ngModel)]="familleForm.sourceRevenu" name="sr" placeholder="Source de revenu">
              </div>
              <div class="field">
                <label>Couverture sociale</label>
                <select [(ngModel)]="familleForm.couvertureSociale" name="cs">
                  <option value="">-- Sélectionner --</option>
                  <option value="Ramed">Ramed</option>
                  <option value="CNSS">CNSS</option>
                  <option value="CNOPS">CNOPS</option>
                  <option value="Aucune">Aucune</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Revenu mensuel</label>
                <select [(ngModel)]="familleForm.revenuMensuel" name="rm">
                  <option value="">-- Sélectionner --</option>
                  <option value="Moins de 500">Moins de 500</option>
                  <option value="500 - 1000">500 - 1000</option>
                  <option value="1000 - 2000">1000 - 2000</option>
                  <option value="Plus de 2000">Plus de 2000</option>
                </select>
              </div>
              <div class="field">
                <label>Type/propriété d'habitat</label>
                <input type="text" [(ngModel)]="familleForm.typeHabitat" name="th" placeholder="Type d'habitat">
              </div>
              <div class="field">
                <label>Nombre de frères</label>
                <input type="number" [(ngModel)]="familleForm.nombreFreres" name="nf" placeholder="0">
              </div>
            </div>
            <div class="form-btns">
              <button type="submit" class="btn btn-primary">
                <mat-icon>save</mat-icon> Enregistrer
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Besoin exprimé -->
      <mat-card *ngIf="activeTab==='besoin'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'besoin'" class="add-form">
            <h4>Nouveau besoin</h4>
            <div class="form-row">
              <div class="field">
                <label>Libellé</label>
                <input type="text" [(ngModel)]="besoinForm.libelle" placeholder="Libellé">
              </div>
              <div class="field">
                <label>Programme</label>
                <select [(ngModel)]="besoinForm.programmeId" (change)="onProgrammeChangeBesoin($event)">
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>Prestation</label>
                <select [(ngModel)]="besoinForm.prestationId">
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let p of prestationsBesoin" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
            </div>
            <div class="field mb-2">
              <label>Description</label>
              <textarea [(ngModel)]="besoinForm.description" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveBesoin()">Ajouter</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ besoins.length }} besoin(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('besoin')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && besoins.length > 0">
            <thead><tr><th>Libellé</th><th>Programme</th><th>Prestation</th><th>Description</th></tr></thead>
            <tbody>
            <tr *ngFor="let b of besoins">
              <td>{{ b.libelle || '-' }}</td>
              <td>{{ b.programmeNom || '-' }}</td>
              <td>{{ b.prestationNom || '-' }}</td>
              <td>{{ b.description || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && besoins.length === 0" class="empty-tab">Aucun besoin enregistré</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Mes prestations -->
      <mat-card *ngIf="activeTab==='prestations'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'prestation'" class="add-form">
            <h4>Nouvelle prestation</h4>
            <div class="form-row">
              <div class="field">
                <label>Établissement *</label>
                <select [(ngModel)]="prestationForm.etablissementId">
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let e of etablissements" [value]="e.id">{{ e.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>Programme *</label>
                <select [(ngModel)]="prestationForm.programmeId" (change)="onProgrammeChangePrestation($event)">
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let p of programmes" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
              <div class="field">
                <label>Prestation *</label>
                <select [(ngModel)]="prestationForm.prestationId">
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let p of prestationsPrestation" [value]="p.id">{{ p.nomFr }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Orientation</label>
                <select [(ngModel)]="prestationForm.orientation">
                  <option value="">-- Sélectionner --</option>
                  <option value="Service interne">Service interne</option>
                  <option value="Service externe">Service externe</option>
                </select>
              </div>
              <div class="field">
                <label>Service interne</label>
                <input type="text" [(ngModel)]="prestationForm.serviceInterne" placeholder="Service">
              </div>
              <div class="field">
                <label>Date début</label>
                <input type="date" [(ngModel)]="prestationForm.dateDebut">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Statut prestation</label>
                <input type="text" [(ngModel)]="prestationForm.statutPrestation" placeholder="Statut">
              </div>
              <div class="field" style="grid-column:span 2">
                <label>Description physique</label>
                <textarea [(ngModel)]="prestationForm.descriptionPhysique" rows="2" class="textarea"></textarea>
              </div>
            </div>
            <div class="field mb-2">
              <label>Pièce jointe</label>
              <input type="file" #prestationFile style="padding:6px">
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="savePrestation(prestationFile)">Ajouter</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ prestationsBeneficiaire.length }} prestation(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('prestation')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && prestationsBeneficiaire.length > 0">
            <thead>
            <tr><th>Établissement</th><th>Programme</th><th>Prestation</th><th>Orientation</th><th>Date début</th><th>Statut</th><th>Pièce jointe</th></tr>
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
                <a *ngIf="p.pieceJointeUrl" [href]="getFileUrl(p.pieceJointeUrl)" target="_blank" class="action-btn" title="Voir">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" title="Upload" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadPieceJointePrestation($event, p.id!)">
                </label>
              </td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && prestationsBeneficiaire.length === 0" class="empty-tab">Aucune prestation enregistrée</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation sociale -->
      <mat-card *ngIf="activeTab==='sociale'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'sociale'" class="add-form">
            <h4>Nouvelle situation sociale</h4>
            <div class="form-row">
              <div class="field">
                <label>Situation de difficulté</label>
                <select [(ngModel)]="socialeForm.situationDifficulte">
                  <option value="">-- Sélectionner --</option>
                  <option value="Victime de violence">Victime de violence</option>
                  <option value="Abandon">Abandon</option>
                  <option value="Négligence">Négligence</option>
                  <option value="Exploitation">Exploitation</option>
                </select>
              </div>
              <div class="field">
                <label>Type de violence</label>
                <input type="text" [(ngModel)]="socialeForm.typeViolence" placeholder="Type">
              </div>
              <div class="field">
                <label>Degré</label>
                <input type="text" [(ngModel)]="socialeForm.degre" placeholder="Degré">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Source de violence</label>
                <input type="text" [(ngModel)]="socialeForm.sourceViolence" placeholder="Source">
              </div>
              <div class="field">
                <label>Lieu de violence</label>
                <input type="text" [(ngModel)]="socialeForm.lieuViolence" placeholder="Lieu">
              </div>
              <div class="field">
                <label>Date de violence</label>
                <input type="date" [(ngModel)]="socialeForm.dateViolence">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Violence répétée</label>
                <input type="text" [(ngModel)]="socialeForm.violenceRepetee" placeholder="Oui/Non">
              </div>
              <div class="field" style="grid-column:span 2">
                <label>Observation</label>
                <textarea [(ngModel)]="socialeForm.observation" rows="3" class="textarea"></textarea>
              </div>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveSociale()">Ajouter</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ situationsSociales.length }} enregistrement(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('sociale')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsSociales.length > 0">
            <thead><tr><th>Situation</th><th>Type violence</th><th>Lieu</th><th>Date</th><th>Observation</th></tr></thead>
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
          <div *ngIf="!loadingTab && situationsSociales.length === 0" class="empty-tab">Aucune situation sociale enregistrée</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation Médicale -->
      <mat-card *ngIf="activeTab==='medicale'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'medicale'" class="add-form">
            <h4>Nouvelle situation médicale</h4>
            <div class="form-row">
              <div class="field">
                <label>Situation Médicale</label>
                <select [(ngModel)]="medicaleForm.situationMedicale">
                  <option value="">-- Sélectionner --</option>
                  <option value="Physique">Physique</option>
                  <option value="Psychique">Psychique</option>
                  <option value="Chronique">Chronique</option>
                  <option value="Handicap">Handicap</option>
                </select>
              </div>
              <div class="field">
                <label>Historique médicale</label>
                <input type="text" [(ngModel)]="medicaleForm.historiqueMedicale" placeholder="Historique">
              </div>
              <div class="field">
                <label>Médecin</label>
                <input type="text" [(ngModel)]="medicaleForm.medecin" placeholder="Nom du médecin">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Utilisation médicament</label>
                <select [(ngModel)]="medicaleForm.utilisationMedicament">
                  <option value="">-- Sélectionner --</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
              <div class="field">
                <label>Date</label>
                <input type="date" [(ngModel)]="medicaleForm.date">
              </div>
              <div class="field">
                <label>Certificat (fichier)</label>
                <input type="file" #certificatFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>Observation</label>
              <textarea [(ngModel)]="medicaleForm.observation" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveMedicale(certificatFile)">Enregistrer</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ situationsMedicales.length }} enregistrement(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('medicale')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsMedicales.length > 0">
            <thead>
            <tr><th>Situation Médicale</th><th>Historique</th><th>Médecin</th><th>Médicament</th><th>Certificat</th><th>Observation</th></tr>
            </thead>
            <tbody>
            <tr *ngFor="let s of situationsMedicales">
              <td>{{ s.situationMedicale || '-' }}</td>
              <td>{{ s.historiqueMedicale || '-' }}</td>
              <td>{{ s.medecin || '-' }}</td>
              <td>{{ s.utilisationMedicament || '-' }}</td>
              <td>
                <a *ngIf="s.certificatUrl" [href]="getFileUrl(s.certificatUrl)" target="_blank" class="action-btn" title="Voir">
                  <mat-icon>description</mat-icon>
                </a>
                <label class="action-btn" title="Upload" *ngIf="canEdit()">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadCertificatMedical($event, s.id!)">
                </label>
              </td>
              <td>{{ s.observation || '-' }}</td>
            </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingTab && situationsMedicales.length === 0" class="empty-tab">Aucune situation médicale enregistrée</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Situation Judiciaire -->
      <mat-card *ngIf="activeTab==='judiciaire'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'judiciaire'" class="add-form">
            <h4>Nouvelle situation judiciaire</h4>
            <div class="form-row">
              <div class="field">
                <label>Peine</label>
                <select [(ngModel)]="judiciaireForm.peine">
                  <option value="">-- Sélectionner --</option>
                  <option value="Peines criminelles">Peines criminelles</option>
                  <option value="Peines correctionnelles">Peines correctionnelles</option>
                  <option value="Peines de police">Peines de police</option>
                </select>
              </div>
              <div class="field">
                <label>Peines criminelles</label>
                <select [(ngModel)]="judiciaireForm.peinesCriminelles">
                  <option value="">-- Sélectionner --</option>
                  <option value="Peine de mort">Peine de mort</option>
                  <option value="Réclusion criminelle">Réclusion criminelle</option>
                  <option value="Détention criminelle">Détention criminelle</option>
                </select>
              </div>
              <div class="field">
                <label>Durée (mois)</label>
                <input type="text" [(ngModel)]="judiciaireForm.duree" placeholder="Durée">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Lieux</label>
                <input type="text" [(ngModel)]="judiciaireForm.lieux" placeholder="Lieu">
              </div>
              <div class="field">
                <label>Date</label>
                <input type="date" [(ngModel)]="judiciaireForm.date">
              </div>
              <div class="field">
                <label>Pièce jointe</label>
                <input type="file" #judiciaireFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>Description</label>
              <textarea [(ngModel)]="judiciaireForm.description" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveJudiciaire(judiciaireFile)">Ajouter</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ situationsJudiciaires.length }} enregistrement(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('judiciaire')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && situationsJudiciaires.length > 0">
            <thead><tr><th>Lieux</th><th>Date</th><th>Durée</th><th>Description</th><th>Pièce jointe</th></tr></thead>
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
          <div *ngIf="!loadingTab && situationsJudiciaires.length === 0" class="empty-tab">Aucune situation judiciaire enregistrée</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Dossier -->
      <mat-card *ngIf="activeTab==='dossier'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'dossier'" class="add-form">
            <h4>Nouveau dossier</h4>
            <div class="form-row">
              <div class="field">
                <label>Type</label>
                <select [(ngModel)]="dossierForm.type">
                  <option value="">-- Sélectionner --</option>
                  <option value="Médicale">Médicale</option>
                  <option value="Scolaire">Scolaire</option>
                  <option value="Judiciaire">Judiciaire</option>
                  <option value="Social">Social</option>
                </select>
              </div>
              <div class="field">
                <label>Date</label>
                <input type="date" [(ngModel)]="dossierForm.date">
              </div>
              <div class="field">
                <label>Pièce jointe</label>
                <input type="file" #dossierFile style="padding:6px">
              </div>
            </div>
            <div class="field mb-2">
              <label>Décisions</label>
              <textarea [(ngModel)]="dossierForm.decisions" rows="3" class="textarea"></textarea>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveDossier(dossierFile)">Ajouter</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ dossiers.length }} dossier(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('dossier')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && dossiers.length > 0">
            <thead><tr><th>Date</th><th>Type</th><th>Décisions</th><th>Pièce jointe</th></tr></thead>
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
          <div *ngIf="!loadingTab && dossiers.length === 0" class="empty-tab">Aucun dossier enregistré</div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Contact -->
      <mat-card *ngIf="activeTab==='contact'" class="tab-card">
        <mat-card-content>
          <div *ngIf="addingForm === 'contact'" class="add-form">
            <h4>Nouveau contact</h4>
            <div class="form-row">
              <div class="field">
                <label>Préciser accompagnement</label>
                <input type="text" [(ngModel)]="contactForm.preciserAccompagnement" placeholder="Type">
              </div>
              <div class="field">
                <label>Nom</label>
                <input type="text" [(ngModel)]="contactForm.nomAccompagnement" placeholder="Nom">
              </div>
              <div class="field">
                <label>Prénom</label>
                <input type="text" [(ngModel)]="contactForm.prenomAccompagnement" placeholder="Prénom">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Adresse</label>
                <input type="text" [(ngModel)]="contactForm.adresseAccompagnement" placeholder="Adresse">
              </div>
              <div class="field">
                <label>Téléphone</label>
                <input type="text" [(ngModel)]="contactForm.telephoneAccompagnement" placeholder="Téléphone">
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" [(ngModel)]="contactForm.emailAccompagnement" placeholder="Email">
              </div>
            </div>
            <div class="form-btns">
              <button class="btn btn-outline" (click)="addingForm=''">Annuler</button>
              <button class="btn btn-primary" (click)="saveContact()">Enregistrer</button>
            </div>
          </div>

          <div class="tab-header">
            <span class="text-secondary">{{ accompagnements.length }} contact(s)</span>
            <button class="btn btn-primary btn-sm" (click)="showAddForm('contact')" *ngIf="canEdit()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
          <div *ngIf="loadingTab" class="flex-center" style="height:100px"><mat-spinner diameter="30"></mat-spinner></div>
          <table class="data-table" *ngIf="!loadingTab && accompagnements.length > 0">
            <thead><tr><th>Accompagnement</th><th>Nom</th><th>Prénom</th><th>Téléphone</th><th>Email</th></tr></thead>
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
          <div *ngIf="!loadingTab && accompagnements.length === 0" class="empty-tab">Aucun contact enregistré</div>
        </mat-card-content>
      </mat-card>

      <div class="audit-info">
        <span>Créé par {{ beneficiaire.createdBy }} le {{ beneficiaire.createdAt | date:'dd/MM/yyyy' }}</span>
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
    private cdr: ChangeDetectorRef
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
      next: b => { this.beneficiaire = b; this.snackBar.open('Enregistré', 'OK', { duration: 3000, panelClass: 'success-snackbar' }); },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
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
        this.snackBar.open('Enregistré', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  saveSociale() {
    this.api.addSituationSociale(this.beneficiaire!.id, this.socialeForm).subscribe({
      next: s => { this.situationsSociales.unshift(s); this.addingForm = ''; this.socialeForm = {}; this.cdr.detectChanges(); this.snackBar.open('Enregistré', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
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
        this.snackBar.open('Enregistré', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
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
        this.snackBar.open('Enregistré', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  saveContact() {
    this.api.addAccompagnement(this.beneficiaire!.id, this.contactForm).subscribe({
      next: a => { this.accompagnements.unshift(a); this.addingForm = ''; this.contactForm = {}; this.cdr.detectChanges(); this.snackBar.open('Enregistré', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  saveBesoin() {
    this.api.addBesoin(this.beneficiaire!.id, this.besoinForm).subscribe({
      next: b => { this.besoins.unshift(b); this.addingForm = ''; this.besoinForm = {}; this.prestationsBesoin = []; this.cdr.detectChanges(); this.snackBar.open('Enregistré', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
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
        this.snackBar.open('Enregistré', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  uploadCertificatMedical(event: any, situationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadCertificatMedical(this.beneficiaire!.id, situationId, file).subscribe({
      next: s => { this.situationsMedicales = this.situationsMedicales.map(x => x.id === s.id ? s : x); this.cdr.detectChanges(); this.snackBar.open('Certificat uploadé', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000 })
    });
  }

  uploadPieceJointeJudiciaire(event: any, situationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointeJudiciaire(this.beneficiaire!.id, situationId, file).subscribe({
      next: s => { this.situationsJudiciaires = this.situationsJudiciaires.map(x => x.id === s.id ? s : x); this.cdr.detectChanges(); this.snackBar.open('Uploadé', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000 })
    });
  }

  uploadPieceJointeDossier(event: any, dossierId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointeDossier(this.beneficiaire!.id, dossierId, file).subscribe({
      next: d => { this.dossiers = this.dossiers.map(x => x.id === d.id ? d : x); this.cdr.detectChanges(); this.snackBar.open('Uploadé', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000 })
    });
  }

  uploadPieceJointePrestation(event: any, prestationId: number) {
    const file = event.target.files[0]; if (!file) return;
    this.api.uploadPieceJointePrestation(this.beneficiaire!.id, prestationId, file).subscribe({
      next: p => { this.prestationsBeneficiaire = this.prestationsBeneficiaire.map(x => x.id === p.id ? p : x); this.cdr.detectChanges(); this.snackBar.open('Uploadé', 'OK', { duration: 3000 }); },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000 })
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
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  canEdit() { return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']); }
}
