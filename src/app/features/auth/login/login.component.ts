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
          <h1>SIIPE</h1>
          <p>Système d'Information Intégré pour la Protection de l'Enfance</p>
          <p class="brand-sub">نظام المعلومات المندمج لحماية الطفولة</p>
        </div>
        <div class="login-footer-text">
          <p>Entraide Nationale — Au service de l'action sociale depuis 1957</p>
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
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email requis</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width mt-2">
                <mat-label>{{ 'AUTH.PASSWORD' | translate }}</mat-label>
                <input matInput [type]="showPassword ? 'text' : 'password'"
                       formControlName="password" autocomplete="current-password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="form.get('password')?.hasError('required')">Mot de passe requis</mat-error>
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
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: white;
    }

    .login-brand {
      text-align: center;
      .brand-logo {
        width: 80px; height: 80px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 24px;
        mat-icon { font-size: 40px; width: 40px; height: 40px; }
      }
      h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; letter-spacing: 4px; }
      p { font-size: 16px; opacity: 0.9; max-width: 320px; text-align: center; line-height: 1.5; }
      .brand-sub { font-size: 14px; opacity: 0.7; margin-top: 8px; direction: rtl; }
    }

    .login-footer-text {
      position: absolute;
      bottom: 24px;
      p { font-size: 12px; opacity: 0.6; }
    }

    .login-right {
      width: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      background: var(--color-bg);
    }

    .login-card {
      width: 100%;
      padding: 8px;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;

      mat-card-title { font-size: 22px; color: var(--color-primary); margin-bottom: 24px; }
    }

    .forgot-link {
      text-align: right;
      margin-top: 4px;
      a { color: var(--color-primary); font-size: 13px; text-decoration: none; &:hover { text-decoration: underline; } }
    }

    .login-btn {
      height: 48px;
      font-size: 16px;
      border-radius: 8px !important;
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
