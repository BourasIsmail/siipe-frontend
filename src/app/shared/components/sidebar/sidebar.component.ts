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
            <span>{{ 'NAV.DASHBOARD' | translate }}</span>
          </a>
        </div>

        <!-- Beneficiaires -->
        <div class="nav-section">
          <div class="nav-section-title">{{ 'NAV.BENEFICIAIRES' | translate }}</div>
          <a class="nav-item" routerLink="/beneficiaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>search</mat-icon>
            <span>{{ 'MENU.RECHERCHE' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/beneficiaires/add" routerLinkActive="active" *ngIf="canCreateBeneficiaire()">
            <mat-icon>person_add</mat-icon>
            <span>{{ 'MENU.INSCRIPTION' | translate }}</span>
          </a>
        </div>

        <!-- Entités impliquées -->
        <div class="nav-section" *ngIf="canSeeEntites()">
          <div class="nav-section-title">{{ 'NAV.ETABLISSEMENTS' | translate }}</div>
          <a class="nav-item" routerLink="/etablissements" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>business</mat-icon>
            <span>{{ 'MENU.ETABLISSEMENTS' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/partenaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>handshake</mat-icon>
            <span>{{ 'MENU.PARTENAIRES' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/subventions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>payments</mat-icon>
            <span>{{ 'MENU.SUBVENTIONS' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/etablissements/map" routerLinkActive="active">
            <mat-icon>map</mat-icon>
            <span>{{ 'MENU.CARTOGRAPHIE' | translate }}</span>
          </a>
        </div>

        <!-- Personnel -->
        <div class="nav-section" *ngIf="canSeePersonnel()">
          <div class="nav-section-title">{{ 'NAV.PERSONNEL' | translate }}</div>
          <a class="nav-item" routerLink="/personnel" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>people</mat-icon>
            <span>{{ 'MENU.PERSONNEL' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/formations" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>school</mat-icon>
            <span>{{ 'MENU.FORMATION_CONTINUE' | translate }}</span>
          </a>
        </div>

        <!-- Administration -->
        <div class="nav-section" *ngIf="isAdmin()">
          <div class="nav-section-title">{{ 'NAV.ADMIN' | translate }}</div>
          <a class="nav-item" routerLink="/admin/users" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>manage_accounts</mat-icon>
            <span>{{ 'MENU.UTILISATEURS' | translate }}</span>
          </a>
          <a class="nav-item" routerLink="/programmes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>category</mat-icon>
            <span>{{ 'MENU.PROGRAMMES' | translate }}</span>
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
      inset-inline-start: 0;
      width: var(--sidebar-width);
      height: calc(100vh - var(--header-height));
      background: white;
      border-inline-end: 1px solid var(--color-border);
      overflow-y: auto;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 900;
      display: flex;
      flex-direction: column;
    }
    :host-context([dir="rtl"]) .sidebar { transform: translateX(100%); }
    .sidebar.open { transform: translateX(0); }
    .sidebar-nav { flex: 1; padding: var(--space-4) var(--space-3); }
    .nav-section { margin-bottom: var(--space-2); }
    .nav-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-tertiary);
      letter-spacing: 0.6px;
      padding: var(--space-4) var(--space-3) var(--space-1);
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px var(--space-3);
      margin: 2px 0;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--color-text);
      font-size: var(--font-base);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-text-secondary);
      transition: color 0.15s ease;
    }
    .nav-item:hover {
      background: var(--color-primary-surface);
      color: var(--color-primary-dark);
    }
    .nav-item:hover mat-icon { color: var(--color-primary); }
    .nav-item.active {
      background: var(--color-primary);
      color: white;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
    }
    .nav-item.active mat-icon { color: white; }
    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4);
      border-top: 1px solid var(--color-border);
      font-size: var(--font-xs);
      color: var(--color-text-secondary);
    }
    .sidebar-footer mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-text-tertiary); }
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
      'ROLE_CHEF_DIVISION', 'ROLE_COORDINATION'
      // ROLE_DIRECTEUR_CENTRALE removed — they only see their own etablissement
    ]);
  }
  // COORDINATION is read-only here but still needs to see the section (list views only)
  canSeePersonnel() { return this.auth.canManagePersonnel() || this.auth.hasRole('ROLE_COORDINATION'); }
}
