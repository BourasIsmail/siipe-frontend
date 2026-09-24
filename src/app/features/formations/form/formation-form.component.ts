import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-formation-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="page-header">
      <h1>{{ 'FORMATION.FORM.TITLE' | translate }}</h1>
    </div>
    <mat-card>
      <mat-card-content>
        <p class="text-secondary">{{ 'COMMON.UNDER_DEVELOPMENT' | translate }}</p>
      </mat-card-content>
    </mat-card>
  `
})
export class FormationFormComponent {}
