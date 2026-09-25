import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  template: `
    <div class="navbar">
      <button class="icon-btn" (click)="toggleSidebar.emit()">
        <mat-icon>menu</mat-icon>
      </button>

      <div class="navbar-brand">
        <span class="brand-text">SIIPE</span>
      </div>

      <span class="spacer"></span>

      <!-- Language dropdown -->
      <div class="dropdown">
        <button class="nav-btn" (click)="toggleLang($event)">
          <mat-icon>language</mat-icon>
          <span>{{ currentLang.toUpperCase() }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <div class="dropdown-menu" [class.show]="langOpen">
          <button class="dropdown-item" (click)="setLang('fr')">🇫🇷 Français</button>
          <button class="dropdown-item" (click)="setLang('ar')">🇲🇦 العربية</button>
        </div>
      </div>

      <!-- User dropdown -->
      <div class="dropdown">
        <button class="nav-btn" (click)="toggleUser($event)">
          <mat-icon>account_circle</mat-icon>
          <span>{{ user?.nom }} {{ user?.prenom }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <div class="dropdown-menu" [class.show]="userOpen">
          <div class="dropdown-header">
            <strong>{{ ('ADMIN.USERS.ROLES.' + (user?.role || '')) | translate }}</strong>
            <small>{{ user?.email }}</small>
          </div>
          <hr>
          <button class="dropdown-item" (click)="logout()">
            <mat-icon>logout</mat-icon>
            {{ 'NAV.LOGOUT' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navbar {
      background-color: var(--color-primary);
      color: white;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1100;
      height: var(--header-height);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .navbar-brand { display: flex; align-items: center; margin-inline-start: 8px; }
    .brand-text { font-size: 20px; font-weight: 700; color: white; letter-spacing: 1px; }
    .spacer { flex: 1; }
    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: white; display: flex; align-items: center;
      padding: 8px; border-radius: 50%;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.15); }
    .nav-btn {
      background: none; border: none; cursor: pointer;
      color: white; display: flex; align-items: center;
      gap: 4px; padding: 8px 12px; border-radius: 4px;
      font-size: 14px; font-family: inherit;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.15); }
    .nav-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      inset-inline-end: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 180px;
      z-index: 9999;
      overflow: hidden;
      flex-direction: column;
    }
    .dropdown-menu.show {
      display: flex;
    }

    .dropdown-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      strong { color: #333; font-size: 13px; }
      small { color: #888; font-size: 12px; }
    }

    hr { margin: 0; border: none; border-top: 1px solid #eee; }

    .dropdown-item {
      background: none;
      border: none;
      cursor: pointer;
      padding: 10px 16px;
      text-align: start;
      font-size: 14px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      font-family: inherit;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #666; }
    }
    .dropdown-item:hover { background: #f5f5f5; }
  `]
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  langOpen = false;
  userOpen = false;

  get user() { return this.auth.getCurrentUser(); }
  get currentLang() { return this.translate.currentLang || 'fr'; }

  constructor(
    private auth: AuthService,
    private translate: TranslateService,
    private router: Router
  ) {}

  toggleLang(e: Event) {
    e.stopPropagation();
    this.langOpen = !this.langOpen;
    this.userOpen = false;
  }

  toggleUser(e: Event) {
    e.stopPropagation();
    this.userOpen = !this.userOpen;
    this.langOpen = false;
  }

  @HostListener('document:click')
  closeAll() {
    this.langOpen = false;
    this.userOpen = false;
  }

  setLang(lang: string) {
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('siipe_lang', lang);
    this.langOpen = false;
  }

  logout() {
    this.auth.logout();
  }
}
