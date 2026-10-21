import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  template: `
    <div class="app-layout">
      <app-navbar (toggleSidebar)="mobileOpen = !mobileOpen" />
      <app-sidebar [mobileOpen]="mobileOpen" (mobileOpenChange)="mobileOpen = $event" />
      <div class="scrim" *ngIf="mobileOpen" (click)="mobileOpen = false"></div>
      <main class="app-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      background: var(--color-bg);
    }
    .app-content {
      padding: 24px;
      padding-top: calc(var(--header-height) + 24px);
      margin-inline-start: var(--sidebar-width-collapsed);
      min-height: 100vh;
    }
    .scrim {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(10, 16, 12, 0.45);
      z-index: 940;
    }
    @media (max-width: 860px) {
      .app-content { margin-inline-start: 0; }
      .scrim { display: block; }
    }
  `]
})
export class LayoutComponent {
  mobileOpen = false;
}
