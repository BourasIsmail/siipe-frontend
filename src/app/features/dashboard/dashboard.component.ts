import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, TranslateModule, NgChartsModule
  ],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
        <span class="text-secondary">{{ 'DASHBOARD.WELCOME' | translate }}, {{ user?.nom }} {{ user?.prenom }}</span>
      </div>

      <div *ngIf="loading" class="flex-center" style="height: 300px">
        <mat-spinner></mat-spinner>
      </div>

      <ng-container *ngIf="!loading && data">
        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card accent-green">
            <div class="stat-card-top"><div class="stat-icon"><mat-icon>people</mat-icon></div></div>
            <div class="stat-value">{{ data.totalBeneficiaires }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_BENEFICIAIRES' | translate }}</div>
          </div>

          <div class="stat-card accent-blue">
            <div class="stat-card-top"><div class="stat-icon"><mat-icon>badge</mat-icon></div></div>
            <div class="stat-value">{{ data.totalPersonnel }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_PERSONNEL' | translate }}</div>
          </div>

          <div class="stat-card accent-orange">
            <div class="stat-card-top"><div class="stat-icon"><mat-icon>business</mat-icon></div></div>
            <div class="stat-value">{{ data.totalEtablissements }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_ETABLISSEMENTS' | translate }}</div>
          </div>

          <div class="stat-card accent-purple">
            <div class="stat-card-top"><div class="stat-icon"><mat-icon>handshake</mat-icon></div></div>
            <div class="stat-value">{{ data.totalPartenaires }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_PARTENAIRES' | translate }}</div>
          </div>

          <div class="stat-card accent-red">
            <div class="stat-card-top"><div class="stat-icon"><mat-icon>payments</mat-icon></div></div>
            <div class="stat-value">{{ data.totalMontantSubventions | number:'1.0-0' }} <span class="unit">MAD</span></div>
            <div class="stat-label">{{ 'DASHBOARD.MONTANT_SUBVENTIONS' | translate }}</div>
          </div>
        </div>

        <!-- Charts row -->
        <h2 class="section-title mt-3">{{ 'DASHBOARD.STATISTIQUES' | translate }}</h2>
        <div class="charts-grid">
          <!-- Beneficiaires par mois -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>{{ 'DASHBOARD.BENEFICIAIRES_PAR_MOIS' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="monthlyChartData"
                [options]="barOptions"
                type="bar">
              </canvas>
            </mat-card-content>
          </mat-card>

          <!-- Beneficiaires par situation -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>{{ 'DASHBOARD.BENEFICIAIRES_PAR_SITUATION' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="situationChartData"
                [options]="pieOptions"
                type="doughnut">
              </canvas>
            </mat-card-content>
          </mat-card>

          <!-- Personnel par grade -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>{{ 'DASHBOARD.PERSONNEL_PAR_GRADE' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="gradeChartData"
                [options]="barOptions"
                type="bar">
              </canvas>
            </mat-card-content>
          </mat-card>

          <!-- Etablissements par province -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>{{ 'DASHBOARD.ETABLISSEMENTS_PAR_PROVINCE' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="provinceChartData"
                [options]="pieOptions"
                type="pie">
              </canvas>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }
    .section-title {
      font-size: var(--font-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-4);
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-4);
    }
    .chart-card {
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow-sm) !important;
      border: 1px solid var(--color-border);
      mat-card-title { font-size: var(--font-md); font-weight: 600; color: var(--color-text); }
      canvas { max-height: 250px; }
    }

    .stat-value .unit { font-size: 13px; font-weight: 600; }

    .accent-green .stat-icon { background: var(--color-primary-surface); color: var(--color-primary); }
    .accent-blue .stat-icon { background: #e7eefb; color: #2458c4; }
    .accent-orange .stat-icon { background: var(--color-accent-surface); color: var(--color-accent); }
    .accent-purple .stat-icon { background: #f3e9fb; color: #7b3fc4; }
    .accent-red .stat-icon { background: var(--color-danger-surface); color: var(--color-danger); }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  data: any = null;

  monthlyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  situationChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  gradeChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  provinceChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  pieOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'right' } }
  };

  get user() { return this.auth.getCurrentUser(); }

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.buildCharts(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildCharts(data: any) {
    const colors = ['#1a7a4c','#b9872f','#2458c4','#7b3fc4','#8a2f55','#4aab80','#dbb04d','#5c9ad6','#a885d8','#b3443a'];

    // Monthly beneficiaires — neutral bars, peak month highlighted in green
    const months = Object.keys(data.beneficiairesByMonth || {});
    const monthValues = months.map(m => data.beneficiairesByMonth[m]);
    const peakIndex = monthValues.indexOf(Math.max(...monthValues));
    this.monthlyChartData = {
      labels: months,
      datasets: [{
        data: monthValues,
        backgroundColor: monthValues.map((_, i) => i === peakIndex ? '#1a7a4c' : '#e6e1d4'),
        borderRadius: 4
      }]
    };

    // Situation
    const situations = Object.keys(data.beneficiairesBySituationDifficulte || {});
    this.situationChartData = {
      labels: situations,
      datasets: [{ data: situations.map(s => data.beneficiairesBySituationDifficulte[s]), backgroundColor: colors }]
    };

    // Grade
    const grades = Object.keys(data.personnelByGrade || {}).slice(0, 8);
    this.gradeChartData = {
      labels: grades,
      datasets: [{ data: grades.map(g => data.personnelByGrade[g]), backgroundColor: '#2458c4' }]
    };

    // Province
    const provinces = Object.keys(data.etablissementsByProvince || {});
    this.provinceChartData = {
      labels: provinces,
      datasets: [{ data: provinces.map(p => data.etablissementsByProvince[p]), backgroundColor: colors }]
    };
  }
}
