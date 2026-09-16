import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-subvention-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="page-header">
      <h1>Formulaire Subvention</h1>
    </div>
    <mat-card>
      <mat-card-content>
        <p class="text-secondary">Composant en cours de développement...</p>
      </mat-card-content>
    </mat-card>
  `
})
export class SubventionFormComponent {}
