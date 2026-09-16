import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, TranslateModule],
  template: `
    <aside class="sidebar" [class.open]="open">
      <nav class="sidebar-nav">

        <div class="nav-section">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>dashboard</mat-icon>
            <span>Tableau de bord</span>
          </a>
        </div>

        <!-- Beneficiaires -->
        <div class="nav-section">
          <div class="nav-section-title">Bénéficiaires</div>
          <a class="nav-item" routerLink="/beneficiaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>search</mat-icon>
            <span>Recherche</span>
          </a>
          <a class="nav-item" routerLink="/beneficiaires/add" routerLinkActive="active" *ngIf="canCreateBeneficiaire()">
            <mat-icon>person_add</mat-icon>
            <span>Inscription</span>
          </a>
        </div>

        <!-- Entités impliquées -->
        <div class="nav-section" *ngIf="canSeeEntites()">
          <div class="nav-section-title">Entités impliquées</div>
          <a class="nav-item" routerLink="/etablissements" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>business</mat-icon>
            <span>Établissements</span>
          </a>
          <a class="nav-item" routerLink="/partenaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>handshake</mat-icon>
            <span>Partenaires</span>
          </a>
          <a class="nav-item" routerLink="/subventions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>payments</mat-icon>
            <span>Subventions</span>
          </a>
          <a class="nav-item" routerLink="/etablissements/map" routerLinkActive="active">
            <mat-icon>map</mat-icon>
            <span>Cartographie</span>
          </a>
        </div>

        <!-- Personnel -->
        <div class="nav-section" *ngIf="canSeePersonnel()">
          <div class="nav-section-title">Gestion du personnel</div>
          <a class="nav-item" routerLink="/personnel" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>people</mat-icon>
            <span>Personnel</span>
          </a>
          <a class="nav-item" routerLink="/formations" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>school</mat-icon>
            <span>Formation continue</span>
          </a>
        </div>

        <!-- Administration -->
        <div class="nav-section" *ngIf="isAdmin()">
          <div class="nav-section-title">Administration</div>
          <a class="nav-item" routerLink="/admin/users" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>manage_accounts</mat-icon>
            <span>Utilisateurs</span>
          </a>
          <a class="nav-item" routerLink="/programmes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>category</mat-icon>
            <span>Programmes</span>
          </a>
        </div>

      </nav>

      <div class="sidebar-footer" *ngIf="province">
        <mat-icon>location_on</mat-icon>
        <span>{{ province }}</span>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: var(--header-height);
      left: 0;
      width: var(--sidebar-width);
      height: calc(100vh - var(--header-height));
      background: white;
      border-right: 1px solid var(--color-border);
      overflow-y: auto;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 900;
      display: flex;
      flex-direction: column;
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-nav { flex: 1; padding: 8px 0; }
    .nav-section { margin-bottom: 4px; }
    .nav-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      letter-spacing: 0.8px;
      padding: 12px 16px 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      text-decoration: none;
      color: var(--color-text);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-text-secondary);
    }
    .nav-item:hover {
      background: #e8f5e9;
      color: var(--color-primary);
    }
    .nav-item:hover mat-icon { color: var(--color-primary); }
    .nav-item.active {
      background: #e8f5e9;
      color: var(--color-primary);
      font-weight: 600;
      border-right: 3px solid var(--color-primary);
    }
    .nav-item.active mat-icon { color: var(--color-primary); }
    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid var(--color-border);
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    .sidebar-footer mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class SidebarComponent {
  @Input() open = true;

  constructor(private auth: AuthService) {}

  get province() { return this.auth.getCurrentUser()?.provinceNom; }
  isAdmin() { return this.auth.isAdmin(); }
  canCreateBeneficiaire() {
    return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ASSISTANTE_SOCIALE']);
  }
  canSeeEntites() {
    return this.auth.hasAnyRole([
      'ROLE_ADMIN', 'ROLE_DELEGUE', 'ROLE_CHEF_SERVICE',
      'ROLE_CHEF_DIVISION'
      // ROLE_DIRECTEUR_CENTRALE removed — they only see their own etablissement
    ]);
  }
  canSeePersonnel() { return this.auth.canManagePersonnel(); }
}
