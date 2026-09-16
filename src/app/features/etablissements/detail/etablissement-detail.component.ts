import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EtablissementCentre } from '../../../core/models/etablissement.model';
import { Personnel } from '../../../core/models/personnel.model';

@Component({
  selector: 'app-etablissement-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div *ngIf="loading" class="flex-center" style="height:300px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <ng-container *ngIf="!loading && etab">
      <!-- Header -->
      <div class="detail-header">
        <div>
          <h1>{{ etab.nomFr }}</h1>
          <div class="nomAr">{{ etab.nomAr }}</div>
          <div class="meta-row">
            <span class="badge badge-blue" *ngIf="etab.typeLocal">{{ formatType(etab.typeLocal) }}</span>
            <span class="badge badge-green" *ngIf="etab.milieu">{{ etab.milieu }}</span>
            <span class="text-secondary">{{ etab.provinceNom }}</span>
            <span class="text-secondary" *ngIf="etab.regionNom">— {{ etab.regionNom }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/etablissements">
            <mat-icon>arrow_back</mat-icon> Retour
          </button>
          <a class="btn btn-primary" [routerLink]="['/etablissements', etab.id, 'edit']" *ngIf="canEdit()">
            <mat-icon>edit</mat-icon> Modifier
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'info'" (click)="activeTab = 'info'">
          <mat-icon>info</mat-icon> Informations
        </button>
        <button class="tab" [class.active]="activeTab === 'tech'" (click)="activeTab = 'tech'">
          <mat-icon>engineering</mat-icon> Données techniques
        </button>
        <button class="tab" [class.active]="activeTab === 'personnel'" (click)="loadPersonnel(); activeTab = 'personnel'">
          <mat-icon>people</mat-icon> Personnel ({{ personnelCount }})
        </button>
        <button class="tab" [class.active]="activeTab === 'docs'" (click)="activeTab = 'docs'">
          <mat-icon>folder</mat-icon> Documents
        </button>
      </div>

      <!-- Tab: Informations -->
      <mat-card *ngIf="activeTab === 'info'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>Identification</h3>
              <div class="info-row"><span>Code</span><strong>{{ etab.code || '-' }}</strong></div>
              <div class="info-row"><span>Téléphone</span><strong>{{ etab.telephone || '-' }}</strong></div>
              <div class="info-row"><span>Fax</span><strong>{{ etab.fax || '-' }}</strong></div>
              <div class="info-row"><span>Adresse</span><strong>{{ etab.adresse || '-' }}</strong></div>
              <div class="info-row"><span>Utilisation</span><strong>{{ etab.utilisation || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Classification</h3>
              <div class="info-row"><span>Milieu</span><strong>{{ etab.milieu || '-' }}</strong></div>
              <div class="info-row"><span>Type de local</span><strong>{{ formatType(etab.typeLocal) }}</strong></div>
              <div class="info-row"><span>Propriété</span><strong>{{ etab.proprietecentre || '-' }}</strong></div>
              <div class="info-row"><span>Géré par</span><strong>{{ etab.gererPar || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Localisation</h3>
              <div class="info-row"><span>Province</span><strong>{{ etab.provinceNom || '-' }}</strong></div>
              <div class="info-row"><span>Région</span><strong>{{ etab.regionNom || '-' }}</strong></div>
              <div class="info-row"><span>Latitude</span><strong>{{ etab.latitude || '-' }}</strong></div>
              <div class="info-row"><span>Longitude</span><strong>{{ etab.longitude || '-' }}</strong></div>
            </div>

            <div class="info-section" *ngIf="etab.programmes?.length">
              <h3>Programmes</h3>
              <div class="tags">
                <span class="tag" *ngFor="let p of etab.programmes">{{ p.nomFr }}</span>
              </div>
            </div>
          </div>

          <!-- Map preview if coordinates exist -->
          <div *ngIf="etab.latitude && etab.longitude" class="map-preview">
            <h3>Position</h3>
            <a [href]="'https://maps.google.com/?q=' + etab.latitude + ',' + etab.longitude"
               target="_blank" class="btn btn-outline">
              <mat-icon>map</mat-icon> Voir sur Google Maps
            </a>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Données techniques -->
      <mat-card *ngIf="activeTab === 'tech'" class="tab-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-section">
              <h3>Superficie & Capacité</h3>
              <div class="info-row"><span>Superficie terrain</span><strong>{{ etab.superficieTerrain ? etab.superficieTerrain + ' m²' : '-' }}</strong></div>
              <div class="info-row"><span>Surface bâtie</span><strong>{{ etab.surfaceBatie ? etab.surfaceBatie + ' m²' : '-' }}</strong></div>
              <div class="info-row"><span>Nombre d'étages</span><strong>{{ etab.nombreEtage ?? '-' }}</strong></div>
              <div class="info-row"><span>Capacité d'accueil</span><strong>{{ etab.capaciteAccueil ?? '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Construction</h3>
              <div class="info-row"><span>Date de construction</span><strong>{{ etab.dateConstruction || '-' }}</strong></div>
              <div class="info-row"><span>Date d'exploitation</span><strong>{{ etab.dateExploitation || '-' }}</strong></div>
              <div class="info-row"><span>État</span><strong>{{ etab.etatConstruction || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Loyer & Foncier</h3>
              <div class="info-row"><span>Numéro de titre</span><strong>{{ etab.numerotitre || '-' }}</strong></div>
              <div class="info-row"><span>Loyer</span><strong>{{ etab.loyer ? 'Oui' : 'Non' }}</strong></div>
              <div class="info-row" *ngIf="etab.loyer"><span>Montant loyer</span><strong>{{ etab.montantLoyer ? etab.montantLoyer + ' MAD/mois' : '-' }}</strong></div>
              <div class="info-row" *ngIf="etab.loyer"><span>Payé par</span><strong>{{ etab.paieLoyer || '-' }}</strong></div>
            </div>

            <div class="info-section">
              <h3>Équipements</h3>
              <div class="info-row">
                <span>Eau potable</span>
                <strong class="bool-val" [class.yes]="etab.raccordementEauPotable">
                  {{ etab.raccordementEauPotable ? '✓ Oui' : '✗ Non' }}
                </strong>
              </div>
              <div class="info-row">
                <span>Électricité</span>
                <strong class="bool-val" [class.yes]="etab.raccordementElectricite">
                  {{ etab.raccordementElectricite ? '✓ Oui' : '✗ Non' }}
                </strong>
              </div>
              <div class="info-row">
                <span>Autorisé</span>
                <strong class="bool-val" [class.yes]="etab.autorise">
                  {{ etab.autorise ? '✓ Oui' : '✗ Non' }}
                </strong>
              </div>
              <div class="info-row" *ngIf="etab.autorise">
                <span>N° autorisation</span>
                <strong>{{ etab.numeroAutorisation || '-' }}</strong>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Personnel -->
      <mat-card *ngIf="activeTab === 'personnel'" class="tab-card">
        <mat-card-content>
          <div *ngIf="loadingPersonnel" class="flex-center" style="height:150px">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
          <div *ngIf="!loadingPersonnel">
            <div class="tab-header">
              <span class="text-secondary">{{ personnel.length }} agent(s)</span>
              <a class="btn btn-primary btn-sm" routerLink="/personnel/add" *ngIf="canEdit()">
                <mat-icon>person_add</mat-icon> Ajouter
              </a>
            </div>
            <table class="data-table" *ngIf="personnel.length > 0">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Matricule</th>
                  <th>Grade</th>
                  <th>Fonction</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of personnel">
                  <td>
                    <a [routerLink]="['/personnel', p.id]" class="link">{{ p.nom }} {{ p.prenom }}</a>
                  </td>
                  <td>{{ p.matricule }}</td>
                  <td>{{ formatEnum(p.grade) }}</td>
                  <td>{{ formatEnum(p.fonction) }}</td>
                  <td>
                    <a [routerLink]="['/personnel', p.id]" class="action-btn">
                      <mat-icon>visibility</mat-icon>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="personnel.length === 0" class="empty-state">
              <mat-icon>people_outline</mat-icon>
              <p>Aucun personnel dans cet établissement</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tab: Documents -->
      <mat-card *ngIf="activeTab === 'docs'" class="tab-card">
        <mat-card-content>
          <div class="docs-grid">
            <div class="doc-item" *ngFor="let doc of documents">
              <div class="doc-icon">
                <mat-icon>description</mat-icon>
              </div>
              <div class="doc-info">
                <div class="doc-name">{{ doc.label }}</div>
                <div *ngIf="doc.url">
                  <a [href]="getFileUrl(doc.url)" target="_blank" class="doc-link">Voir le fichier</a>
                </div>
                <div *ngIf="!doc.url" class="text-secondary" style="font-size:12px">Non disponible</div>
              </div>
              <div class="doc-upload" *ngIf="canEdit()">
                <label class="upload-btn">
                  <mat-icon>upload</mat-icon>
                  <input type="file" hidden (change)="uploadFile($event, doc.type)">
                </label>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Audit info -->
      <div class="audit-info">
        <span>Créé par {{ etab.createdBy }} le {{ etab.createdAt | date:'dd/MM/yyyy' }}</span>
        <span *ngIf="etab.updatedAt"> — Modifié le {{ etab.updatedAt | date:'dd/MM/yyyy' }}</span>
      </div>
    </ng-container>
  `,
  styles: [`
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 4px; }
    }
    .nomAr { font-size: 16px; color: #666; direction: rtl; margin-bottom: 8px; }
    .meta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; }

    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: none; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer;
      font-weight: 500; text-decoration: none;
    }
    .btn-sm { padding: 6px 12px; font-size: 13px; }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-outline { background: white; color: #555; border: 1px solid #ccc; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .tabs {
      display: flex; gap: 4px; margin-bottom: 16px;
      border-bottom: 2px solid #e0e0e0; padding-bottom: 0;
    }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border: none; background: none;
      cursor: pointer; font-size: 14px; color: #666;
      border-bottom: 3px solid transparent; margin-bottom: -2px;
      font-family: inherit; border-radius: 4px 4px 0 0;
    }
    .tab:hover { background: #f5f5f5; color: var(--color-primary); }
    .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
    .tab mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .tab-card { border-radius: 0 8px 8px 8px !important; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
    }
    .info-section h3 {
      color: var(--color-primary); font-size: 14px; font-weight: 600;
      border-bottom: 1px solid #e8f5e9; padding-bottom: 8px; margin-bottom: 12px;
    }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; border-bottom: 1px solid #fafafa; font-size: 14px;
      span { color: #666; }
      strong { color: #333; text-align: right; }
    }
    .bool-val { color: #c62828; }
    .bool-val.yes { color: #2e7d32; }

    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      background: #e8f5e9; color: var(--color-primary);
      padding: 4px 12px; border-radius: 16px; font-size: 13px;
    }

    .badge {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
    }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }

    .tab-header {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 16px;
    }

    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th {
      background: var(--color-primary); color: white;
      padding: 10px 14px; text-align: left; font-size: 13px;
    }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
    .data-table tr:hover td { background: #f9f9f9; }
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border: none; border-radius: 4px;
      background: transparent; cursor: pointer; color: #666; text-decoration: none;
    }
    .action-btn:hover { background: #f0f0f0; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .empty-state {
      text-align: center; padding: 40px; color: #bbb;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }
    }

    .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .doc-item {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;
    }
    .doc-icon { color: var(--color-primary); mat-icon { font-size: 32px; width: 32px; height: 32px; } }
    .doc-name { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
    .doc-link { color: var(--color-primary); font-size: 13px; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
    .doc-upload { margin-left: auto; }
    .upload-btn {
      display: flex; align-items: center; cursor: pointer;
      color: #666; padding: 6px; border-radius: 4px;
    }
    .upload-btn:hover { background: #f5f5f5; color: var(--color-primary); }

    .map-preview { margin-top: 24px; }
    .map-preview h3 { color: var(--color-primary); font-size: 14px; margin-bottom: 12px; }

    .audit-info {
      margin-top: 16px; font-size: 12px; color: #bbb;
      text-align: right; padding-bottom: 32px;
    }
  `]
})
export class EtablissementDetailComponent implements OnInit {
  etab: EtablissementCentre | null = null;
  personnel: Personnel[] = [];
  loading = true;
  loadingPersonnel = false;
  activeTab = 'info';
  personnelCount = 0;

  documents = [
    { label: 'Mappe cadastrale', type: 'mappeCadastrale', url: '' },
    { label: 'Certificat de propriété', type: 'certificatPropriete', url: '' },
    { label: 'Plan de situation', type: 'planSituation', url: '' },
    { label: 'Plan d\'architecture', type: 'planArchitecture', url: '' },
    { label: 'Photo', type: 'photo', url: '' },
  ];

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
    this.api.getEtablissement(+id).subscribe({
      next: e => {
        this.etab = e;
        this.documents = this.documents.map(d => ({
          ...d,
          url: (e as any)[d.type + 'Url'] || ''
        }));
        this.loading = false;
        this.cdr.detectChanges();
        // preload personnel count
        this.api.getPersonnel().subscribe(p => {
          this.personnelCount = p.filter(x => x.etablissementCentreId === e.id).length;
          this.cdr.detectChanges();
        });
      },
      error: () => this.loading = false
    });
  }

  loadPersonnel() {
    if (this.personnel.length > 0 || !this.etab) return;
    this.loadingPersonnel = true;
    this.api.getPersonnel().subscribe({
      next: p => {
        this.personnel = p.filter(x => x.etablissementCentreId === this.etab!.id);
        this.loadingPersonnel = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingPersonnel = false
    });
  }

  uploadFile(event: any, fileType: string) {
    const file = event.target.files[0];
    if (!file || !this.etab) return;
    this.api.uploadEtablissementFile(this.etab.id, fileType, file).subscribe({
      next: e => {
        this.etab = e;
        this.documents = this.documents.map(d => ({
          ...d, url: (e as any)[d.type + 'Url'] || ''
        }));
        this.snackBar.open('Fichier uploadé', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erreur upload', 'Fermer', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  getFileUrl(path: string): string {
    return `http://localhost:8080/api/files?path=${path}`;
  }

  formatType(type: string | undefined): string {
    const map: Record<string, string> = {
      CENTRE_SOCIALE: 'Centre sociale', DELEGATION: 'Délégation',
      COORDINATION: 'Coordination', DEPOT: 'Dépôt', AUTRE: 'Autre'
    };
    return type ? (map[type] || type) : '-';
  }

  formatEnum(val: string | undefined): string {
    if (!val) return '-';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  canEdit() {
    return this.auth.hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION', 'ROLE_DIRECTEUR_CENTRALE'
    ]);
  }
}
