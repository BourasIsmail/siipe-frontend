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
      <app-navbar (toggleSidebar)="sidebarOpen = !sidebarOpen" />
      <app-sidebar [open]="sidebarOpen" />
      <main class="app-content" [class.sidebar-open]="sidebarOpen">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      background: #f5f5f5;
    }
    .app-content {
      padding: 24px;
      padding-top: calc(var(--header-height) + 24px);
      margin-left: 0;
      transition: margin-left 0.3s ease;
      min-height: 100vh;
    }
    .app-content.sidebar-open {
      margin-left: var(--sidebar-width);
    }
  `]
})
export class LayoutComponent {
  sidebarOpen = true;
}
