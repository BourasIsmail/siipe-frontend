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
        <button class="nav-btn user-btn" (click)="toggleUser($event)">
          <span class="avatar">{{ initials }}</span>
          <span class="user-name">{{ user?.nom }} {{ user?.prenom }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <div class="dropdown-menu" [class.show]="userOpen">
          <div class="dropdown-header">
            <span class="avatar avatar-lg">{{ initials }}</span>
            <div>
              <strong>{{ ('ADMIN.USERS.ROLES.' + (user?.role || '')) | translate }}</strong>
              <small>{{ user?.email }}</small>
            </div>
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
      background: linear-gradient(120deg, var(--color-primary-dark), var(--color-primary));
      color: white;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1100;
      height: var(--header-height);
      display: flex;
      align-items: center;
      padding: 0 var(--space-5);
      gap: var(--space-2);
      box-shadow: var(--shadow-md);
    }
    .spacer { flex: 1; }
    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: white; display: flex; align-items: center;
      padding: 8px; border-radius: 50%;
      transition: background 0.15s ease;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.15); }
    .nav-btn {
      background: none; border: none; cursor: pointer;
      color: white; display: flex; align-items: center;
      gap: 6px; padding: 6px 10px 6px 6px; border-radius: var(--radius-xl);
      font-size: var(--font-base); font-family: inherit;
      transition: background 0.15s ease;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.15); }
    .nav-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .user-btn { padding-inline-start: 4px; }
    .user-name { font-weight: 500; }

    .avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.22);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
      flex-shrink: 0;
    }
    .avatar-lg { width: 40px; height: 40px; font-size: 15px; background: var(--color-primary-surface); color: var(--color-primary-dark); }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      top: calc(100% + 10px);
      inset-inline-end: 0;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      min-width: 220px;
      z-index: 9999;
      overflow: hidden;
      flex-direction: column;
    }
    .dropdown-menu.show {
      display: flex;
    }

    .dropdown-header {
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      strong { display: block; color: var(--color-text); font-size: var(--font-sm); font-weight: 600; }
      small { color: var(--color-text-secondary); font-size: var(--font-xs); }
    }

    hr { margin: 0; border: none; border-top: 1px solid var(--color-border); }

    .dropdown-item {
      background: none;
      border: none;
      cursor: pointer;
      padding: 12px 16px;
      text-align: start;
      font-size: var(--font-base);
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      font-family: inherit;
      transition: background 0.15s ease;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-secondary); }
    }
    .dropdown-item:hover { background: var(--color-primary-surface); }
  `]
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  langOpen = false;
  userOpen = false;

  get user() { return this.auth.getCurrentUser(); }
  get currentLang() { return this.translate.currentLang || 'fr'; }
  get initials() {
    const u = this.user;
    if (!u) return '';
    return `${u.nom?.charAt(0) || ''}${u.prenom?.charAt(0) || ''}`.toUpperCase();
  }

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
