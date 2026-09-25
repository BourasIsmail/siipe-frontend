import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, TranslateModule
  ],
  template: `
    <div class="reset-page">
      <mat-card class="reset-card">
        <mat-card-header>
          <mat-card-title>
            {{ token ? ('AUTH.RESET_PASSWORD' | translate) : ('AUTH.FORGOT_PASSWORD' | translate) }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Step 1: Request reset -->
          <form *ngIf="!token" [formGroup]="emailForm" (ngSubmit)="onRequestReset()">
            <p class="info-text">{{ 'AUTH.RESET_INFO' | translate }}</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'AUTH.EMAIL' | translate }}</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit"
                    class="full-width mt-2" [disabled]="emailForm.invalid || loading">
              {{ 'AUTH.SEND_RESET_LINK' | translate }}
            </button>
          </form>

          <!-- Step 2: Set new password -->
          <form *ngIf="token" [formGroup]="passwordForm" (ngSubmit)="onResetPassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'AUTH.NEW_PASSWORD' | translate }}</mat-label>
              <input matInput type="password" formControlName="newPassword">
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit"
                    class="full-width mt-2" [disabled]="passwordForm.invalid || loading">
              {{ 'AUTH.RESET_PASSWORD' | translate }}
            </button>
          </form>

          <div class="back-link mt-2">
            <a routerLink="/auth/login">
              <mat-icon>arrow_back</mat-icon>
              {{ 'AUTH.BACK_TO_LOGIN' | translate }}
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
    }
    .reset-card {
      width: 400px;
      padding: 16px;
      border-radius: 12px !important;
    }
    .info-text { color: var(--color-text-secondary); margin-bottom: 16px; font-size: 14px; }
    .back-link a {
      display: flex; align-items: center; gap: 4px;
      color: var(--color-primary); text-decoration: none; font-size: 14px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  emailForm: FormGroup;
  passwordForm: FormGroup;
  token: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.passwordForm = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(8)]] });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onRequestReset() {
    this.loading = true;
    this.auth.forgotPassword(this.emailForm.value.email).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('AUTH.RESET_LINK_SENT'), 'OK', { duration: 5000 });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onResetPassword() {
    this.loading = true;
    this.auth.resetPassword(this.token!, this.passwordForm.value.newPassword).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS'), 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || this.translate.instant('COMMON.ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 4000, panelClass: 'error-snackbar' });
      }
    });
  }
}
