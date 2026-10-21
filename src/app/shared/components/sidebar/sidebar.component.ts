import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, TranslateModule],
  template: `
    <aside class="rail" [class.mobile-open]="mobileOpen" [class.pinned]="pinned">
      <nav class="rail-nav">

        <div class="rail-group">
          <a class="rail-item" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>dashboard</mat-icon>
            <span class="label">{{ 'NAV.DASHBOARD' | translate }}</span>
          </a>
        </div>

        <!-- Beneficiaires -->
        <div class="rail-group">
          <div class="rail-group-title">{{ 'NAV.BENEFICIAIRES' | translate }}</div>
          <a class="rail-item" routerLink="/beneficiaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>search</mat-icon>
            <span class="label">{{ 'MENU.RECHERCHE' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/beneficiaires/add" routerLinkActive="active" *ngIf="canCreateBeneficiaire()" (click)="onNavigate()">
            <mat-icon>person_add</mat-icon>
            <span class="label">{{ 'MENU.INSCRIPTION' | translate }}</span>
          </a>
        </div>

        <!-- Entités impliquées -->
        <div class="rail-group" *ngIf="canSeeEntites()">
          <div class="rail-group-title">{{ 'NAV.ETABLISSEMENTS' | translate }}</div>
          <a class="rail-item" routerLink="/etablissements" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>business</mat-icon>
            <span class="label">{{ 'MENU.ETABLISSEMENTS' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/partenaires" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>handshake</mat-icon>
            <span class="label">{{ 'MENU.PARTENAIRES' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/subventions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>payments</mat-icon>
            <span class="label">{{ 'MENU.SUBVENTIONS' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/etablissements/map" routerLinkActive="active" (click)="onNavigate()">
            <mat-icon>map</mat-icon>
            <span class="label">{{ 'MENU.CARTOGRAPHIE' | translate }}</span>
          </a>
        </div>

        <!-- Personnel -->
        <div class="rail-group" *ngIf="canSeePersonnel()">
          <div class="rail-group-title">{{ 'NAV.PERSONNEL' | translate }}</div>
          <a class="rail-item" routerLink="/personnel" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>people</mat-icon>
            <span class="label">{{ 'MENU.PERSONNEL' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/formations" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>school</mat-icon>
            <span class="label">{{ 'MENU.FORMATION_CONTINUE' | translate }}</span>
          </a>
        </div>

        <!-- Administration -->
        <div class="rail-group" *ngIf="isAdmin()">
          <div class="rail-group-title">{{ 'NAV.ADMIN' | translate }}</div>
          <a class="rail-item" routerLink="/admin/users" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>manage_accounts</mat-icon>
            <span class="label">{{ 'MENU.UTILISATEURS' | translate }}</span>
          </a>
          <a class="rail-item" routerLink="/programmes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="onNavigate()">
            <mat-icon>category</mat-icon>
            <span class="label">{{ 'MENU.PROGRAMMES' | translate }}</span>
          </a>
        </div>

      </nav>

      <div class="rail-spacer"></div>

      <div class="rail-footer" *ngIf="province">
        <mat-icon>location_on</mat-icon>
        <span class="label">{{ province }}</span>
      </div>

      <button class="rail-pin" (click)="togglePin()" [attr.aria-pressed]="pinned">
        <mat-icon>{{ pinned ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right' }}</mat-icon>
        <span class="label">{{ 'NAV.PIN' | translate }}</span>
      </button>
    </aside>
  `,
  styles: [`
    .rail {
      position: fixed;
      top: var(--header-height);
      inset-inline-start: 0;
      width: var(--sidebar-width-collapsed);
      height: calc(100vh - var(--header-height));
      background: var(--color-rail-bg);
      overflow: hidden;
      transition: width 0.18s ease;
      z-index: 950;
      display: flex;
      flex-direction: column;
      padding: var(--space-3) 0;
    }
    .rail:hover, .rail.pinned { width: var(--sidebar-width); }
    .rail:hover { box-shadow: var(--shadow-lg); }

    .rail-nav { display: flex; flex-direction: column; padding: 0 var(--space-3); overflow-y: auto; overflow-x: hidden; }
    .rail-group { margin-bottom: var(--space-1); }
    .rail-group-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-rail-ink-dim);
      letter-spacing: 0.6px;
      padding: var(--space-3) var(--space-3) var(--space-1);
      white-space: nowrap;
    }
    .rail-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px var(--space-3);
      margin: 2px 0;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--color-rail-ink);
      font-size: var(--font-base);
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .rail-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: color 0.15s ease;
    }
    .rail-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .rail-item.active { background: var(--color-primary); color: #fff; font-weight: 600; }

    .label { opacity: 0; transition: opacity 0.12s ease; }
    .rail:hover .label, .rail.pinned .label { opacity: 1; }

    .rail-spacer { flex: 1; }

    .rail-footer {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: var(--font-xs);
      color: var(--color-rail-ink-dim);
      white-space: nowrap;
      overflow: hidden;
    }
    .rail-footer mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }

    .rail-pin {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-1) var(--space-3) 0;
      padding: 10px var(--space-3);
      border-radius: var(--radius-md);
      background: none;
      border: none;
      color: var(--color-rail-ink-dim);
      cursor: pointer;
      font-size: var(--font-sm);
      font-family: inherit;
      white-space: nowrap;
    }
    .rail-pin:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .rail-pin mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    @media (max-width: 860px) {
      .rail {
        width: var(--sidebar-width);
        inset-inline-start: calc(-1 * var(--sidebar-width));
        transition: inset-inline-start 0.25s ease;
        box-shadow: var(--shadow-lg);
      }
      .rail.mobile-open { inset-inline-start: 0; }
      .label { opacity: 1; }
      .rail-pin { display: none; }
    }
  `]
})
export class SidebarComponent {
  @Input() mobileOpen = false;
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  pinned = false;

  constructor(private auth: AuthService) {
    try {
      this.pinned = localStorage.getItem('siipe_sidebar_pinned') === 'true';
    } catch {
      this.pinned = false;
    }
  }

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

  togglePin() {
    this.pinned = !this.pinned;
    try {
      localStorage.setItem('siipe_sidebar_pinned', String(this.pinned));
    } catch {
      // ignore storage errors (private mode, disabled storage)
    }
  }

  onNavigate() {
    if (this.mobileOpen) this.mobileOpenChange.emit(false);
  }
}
