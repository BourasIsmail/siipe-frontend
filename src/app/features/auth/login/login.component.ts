import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, TranslateModule
  ],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="login-brand">
          <div class="brand-logo">
            <mat-icon>shield</mat-icon>
          </div>
        </div>
        <div class="login-footer-text">
          <p>{{ 'AUTH.FOOTER_MOTTO' | translate }}</p>
        </div>
      </div>

      <div class="login-right">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>{{ 'AUTH.LOGIN' | translate }}</mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ 'AUTH.EMAIL' | translate }}</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email">
                <mat-icon matPrefix>email</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">{{ 'AUTH.EMAIL_REQUIRED' | translate }}</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">{{ 'AUTH.EMAIL_INVALID' | translate }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width mt-2">
                <mat-label>{{ 'AUTH.PASSWORD' | translate }}</mat-label>
                <input matInput [type]="showPassword ? 'text' : 'password'"
                       formControlName="password" autocomplete="current-password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="form.get('password')?.hasError('required')">{{ 'AUTH.PASSWORD_REQUIRED' | translate }}</mat-error>
              </mat-form-field>

              <div class="forgot-link">
                <a routerLink="/auth/reset-password">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
              </div>

              <button mat-raised-button color="primary" type="submit"
                      class="full-width login-btn mt-2"
                      [disabled]="form.invalid || loading">
                <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                <span *ngIf="!loading">{{ 'AUTH.SIGN_IN' | translate }}</span>
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
    }

    .login-left {
      flex: 1;
      position: relative;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: white;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0, transparent 40%),
                           radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0, transparent 45%);
        pointer-events: none;
      }
    }

    .login-brand {
      text-align: center;
      position: relative;
      z-index: 1;
      .brand-logo {
        width: 88px; height: 88px;
        background: rgba(255,255,255,0.16);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: var(--radius-xl);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto;
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        mat-icon { font-size: 42px; width: 42px; height: 42px; }
      }
    }

    .login-footer-text {
      position: absolute;
      bottom: 24px;
      z-index: 1;
      p { font-size: var(--font-xs); opacity: 0.65; letter-spacing: 0.2px; }
    }

    .login-right {
      width: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      background: var(--color-bg);
    }

    .login-card {
      width: 100%;
      padding: var(--space-2);
      border-radius: var(--radius-xl) !important;
      box-shadow: var(--shadow-lg) !important;
      border: 1px solid var(--color-border);

      mat-card-title { font-size: var(--font-xl); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-6); }
    }

    .forgot-link {
      text-align: end;
      margin-top: var(--space-1);
      a { color: var(--color-primary); font-size: var(--font-sm); font-weight: 500; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .login-btn {
      height: 48px;
      font-size: var(--font-md);
      font-weight: 600;
      border-radius: var(--radius-md) !important;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    @media (max-width: 768px) {
      .login-left { display: none; }
      .login-right { width: 100%; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Email ou mot de passe incorrect',
          'Fermer',
          { duration: 4000, panelClass: 'error-snackbar' }
        );
      }
    });
  }
}
