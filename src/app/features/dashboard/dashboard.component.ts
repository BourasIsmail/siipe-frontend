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
          <div class="stat-card">
            <div class="stat-icon" style="background:#e8f5e9">
              <mat-icon style="color:#2e7d32">people</mat-icon>
            </div>
            <div>
              <div class="stat-value">{{ data.totalBeneficiaires }}</div>
              <div class="stat-label">{{ 'DASHBOARD.TOTAL_BENEFICIAIRES' | translate }}</div>
            </div>
          </div>

          <div class="stat-card" style="border-left-color:#1976d2">
            <div class="stat-icon" style="background:#e3f2fd">
              <mat-icon style="color:#1976d2">badge</mat-icon>
            </div>
            <div>
              <div class="stat-value" style="color:#1976d2">{{ data.totalPersonnel }}</div>
              <div class="stat-label">{{ 'DASHBOARD.TOTAL_PERSONNEL' | translate }}</div>
            </div>
          </div>

          <div class="stat-card" style="border-left-color:#f57c00">
            <div class="stat-icon" style="background:#fff3e0">
              <mat-icon style="color:#f57c00">business</mat-icon>
            </div>
            <div>
              <div class="stat-value" style="color:#f57c00">{{ data.totalEtablissements }}</div>
              <div class="stat-label">{{ 'DASHBOARD.TOTAL_ETABLISSEMENTS' | translate }}</div>
            </div>
          </div>

          <div class="stat-card" style="border-left-color:#7b1fa2">
            <div class="stat-icon" style="background:#f3e5f5">
              <mat-icon style="color:#7b1fa2">handshake</mat-icon>
            </div>
            <div>
              <div class="stat-value" style="color:#7b1fa2">{{ data.totalPartenaires }}</div>
              <div class="stat-label">{{ 'DASHBOARD.TOTAL_PARTENAIRES' | translate }}</div>
            </div>
          </div>

          <div class="stat-card" style="border-left-color:#c62828">
            <div class="stat-icon" style="background:#ffebee">
              <mat-icon style="color:#c62828">payments</mat-icon>
            </div>
            <div>
              <div class="stat-value" style="color:#c62828">{{ data.totalMontantSubventions | number:'1.0-0' }} MAD</div>
              <div class="stat-label">{{ 'DASHBOARD.MONTANT_SUBVENTIONS' | translate }}</div>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-grid mt-3">
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
      gap: 16px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
    }
    .chart-card {
      mat-card-title { font-size: 14px; color: var(--color-primary); }
      canvas { max-height: 250px; }
    }
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
    const colors = ['#2e7d32','#388e3c','#43a047','#4caf50','#66bb6a','#81c784','#a5d6a7','#c8e6c9','#e8f5e9','#1b5e20','#f57c00','#1976d2'];

    // Monthly beneficiaires
    const months = Object.keys(data.beneficiairesByMonth || {});
    this.monthlyChartData = {
      labels: months,
      datasets: [{ data: months.map(m => data.beneficiairesByMonth[m]), backgroundColor: '#4caf50', borderColor: '#2e7d32', borderWidth: 1 }]
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
      datasets: [{ data: grades.map(g => data.personnelByGrade[g]), backgroundColor: '#1976d2' }]
    };

    // Province
    const provinces = Object.keys(data.etablissementsByProvince || {});
    this.provinceChartData = {
      labels: provinces,
      datasets: [{ data: provinces.map(p => data.etablissementsByProvince[p]), backgroundColor: colors }]
    };
  }
}
