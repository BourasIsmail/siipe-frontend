import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import '@maplibre/maplibre-gl-leaflet';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { EtablissementCentre } from '../../../core/models/etablissement.model';
import { buildSatelliteLabelsStyle, ESRI_WORLD_IMAGERY_URL } from '../../../shared/map/satellite-labels-style';

@Component({
  selector: 'app-etablissements-map',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatProgressSpinnerModule, MatIconModule, TranslateModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'ETABLISSEMENT.MAP.TITLE' | translate }}</h1>
      <a class="btn btn-outline" routerLink="/etablissements">
        <mat-icon>list</mat-icon> {{ 'ETABLISSEMENT.MAP.LIST_VIEW' | translate }}
      </a>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat">
        <mat-icon>business</mat-icon>
        <span><strong>{{ total }}</strong> {{ 'ETABLISSEMENT.MAP.TOTAL' | translate }}</span>
      </div>
      <div class="stat">
        <mat-icon>location_on</mat-icon>
        <span><strong>{{ withCoords }}</strong> {{ 'ETABLISSEMENT.MAP.GEOLOCATED' | translate }}</span>
      </div>
      <div class="stat">
        <mat-icon>location_off</mat-icon>
        <span><strong>{{ total - withCoords }}</strong> {{ 'ETABLISSEMENT.MAP.NO_COORDS' | translate }}</span>
      </div>
      <div class="filter-group">
        <label>{{ 'ETABLISSEMENT.MAP.FILTER_TYPE' | translate }}</label>
        <select [(ngModel)]="selectedType" (ngModelChange)="applyFilter()">
          <option value="">{{ 'COMMON.ALL' | translate }}</option>
          <option value="CENTRE_SOCIALE">{{ 'ETABLISSEMENT.TYPES.CENTRE_SOCIALE' | translate }}</option>
          <option value="DELEGATION">{{ 'ETABLISSEMENT.TYPES.DELEGATION' | translate }}</option>
          <option value="COORDINATION">{{ 'ETABLISSEMENT.TYPES.COORDINATION' | translate }}</option>
          <option value="DEPOT">{{ 'ETABLISSEMENT.TYPES.DEPOT' | translate }}</option>
          <option value="AUTRE">{{ 'ETABLISSEMENT.TYPES.AUTRE' | translate }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>{{ 'ETABLISSEMENT.MAP.FILTER_MILIEU' | translate }}</label>
        <select [(ngModel)]="selectedMilieu" (ngModelChange)="applyFilter()">
          <option value="">{{ 'COMMON.ALL' | translate }}</option>
          <option value="URBAIN">{{ 'ETABLISSEMENT.MILIEUX.URBAIN' | translate }}</option>
          <option value="RURAL">{{ 'ETABLISSEMENT.MILIEUX.RURAL' | translate }}</option>
        </select>
      </div>
    </div>

    <!-- Map always visible, spinner overlay when loading -->
    <mat-card class="map-card">
      <mat-card-content style="padding:0;position:relative">
        <div *ngIf="loading" class="map-loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <div id="main-map" class="main-map"></div>
      </mat-card-content>
    </mat-card>

    <!-- No coords warning -->
    <div *ngIf="noCoordsList.length > 0" class="no-coords-panel">
      <h3>
        <mat-icon>warning</mat-icon>
        {{ 'ETABLISSEMENT.MAP.NO_COORDS_WARNING' | translate }} ({{ noCoordsList.length }})
      </h3>
      <div class="no-coords-list">
        <div class="no-coords-item" *ngFor="let e of noCoordsList">
          <span>{{ e.nomFr }}</span>
          <span class="text-secondary">{{ e.provinceNom || '-' }}</span>
          <a [routerLink]="['/etablissements', e.id, 'edit']" class="link">{{ 'ETABLISSEMENT.MAP.ADD_COORDS' | translate }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-bar {
      display: flex; align-items: center; gap: 24px;
      background: white; padding: 12px 20px; border-radius: 8px;
      margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      flex-wrap: wrap;
    }
    .stat {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; color: #555;
    }
    .stat mat-icon { color: var(--color-primary); font-size: 20px; width: 20px; height: 20px; }
    .stat strong { color: var(--color-primary); }
    .filter-group {
      display: flex; align-items: center; gap: 8px; margin-left: auto;
      label { font-size: 13px; color: #666; white-space: nowrap; }
      select {
        padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px;
        font-size: 13px; font-family: inherit; background: white;
      }
    }
    .map-card {
      padding: 0 !important;
      overflow: hidden;
      border-radius: 12px !important;
    }
    .map-loading {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.8); z-index: 1000;
    }
    .main-map {
      height: calc(100vh - 260px);
      min-height: 500px;
      width: 100%;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 14px; font-family: inherit; cursor: pointer;
      background: white; color: #555; text-decoration: none;
    }
    .btn:hover { background: #f5f5f5; }
    .btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .no-coords-panel {
      margin-top: 16px; background: white; border-radius: 8px;
      padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .no-coords-panel h3 {
      display: flex; align-items: center; gap: 8px;
      color: #f57c00; font-size: 14px; margin-bottom: 12px;
    }
    .no-coords-panel h3 mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .no-coords-list {
      display: flex; flex-direction: column; gap: 8px;
      max-height: 200px; overflow-y: auto;
    }
    .no-coords-item {
      display: flex; align-items: center; gap: 16px;
      padding: 8px 12px; background: #fff8e1; border-radius: 6px; font-size: 13px;
    }
    .link { color: var(--color-primary); text-decoration: none; margin-left: auto; font-size: 12px; }
    .link:hover { text-decoration: underline; }
  `]
})
export class EtablissementsMapComponent implements OnInit, AfterViewInit {
  all: EtablissementCentre[] = [];
  filtered: EtablissementCentre[] = [];
  noCoordsList: EtablissementCentre[] = [];
  loading = true;
  map: any;
  markersLayer: any;
  selectedType = '';
  selectedMilieu = '';
  total = 0;
  withCoords = 0;
  mapReady = false;

  private readonly icons: Record<string, L.Icon> = {
    CENTRE_SOCIALE: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    DELEGATION: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    COORDINATION: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    DEFAULT: L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private translate: TranslateService) {}

  ngOnInit() {
    this.api.getEtablissements().subscribe({
      next: data => {
        this.all = data;
        this.total = data.length;
        this.withCoords = data.filter(e => e.latitude && e.longitude).length;
        this.noCoordsList = data.filter(e => !e.latitude || !e.longitude);
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
        if (this.mapReady) this.renderMarkers();
      },
      error: (e) => {
        console.error('API error:', e);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.mapReady = true;
      if (!this.loading) this.renderMarkers();
    }, 200);
  }

  initMap() {
    if (this.map) return;
    const el = document.getElementById('main-map');
    if (!el) { console.error('Map element not found'); return; }

    this.map = L.map('main-map', { zoomControl: true }).setView([31.7917, -7.0926], 6);

    L.tileLayer(ESRI_WORLD_IMAGERY_URL, {
      attribution: 'Imagery © Esri',
      maxZoom: 19
    }).addTo(this.map);

    L.maplibreGL({
      style: buildSatelliteLabelsStyle(),
      interactive: false
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    // Legend
    const legend = (L as any).control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="background:white;padding:12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:12px;line-height:1.8">
          <strong style="display:block;margin-bottom:6px;color:#2e7d32">${this.translate.instant('ETABLISSEMENT.MAP.LEGEND')}</strong>
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" height="16" style="vertical-align:middle;margin-right:6px"> ${this.translate.instant('ETABLISSEMENT.TYPES.CENTRE_SOCIALE')}</div>
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" height="16" style="vertical-align:middle;margin-right:6px"> ${this.translate.instant('ETABLISSEMENT.TYPES.DELEGATION')}</div>
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" height="16" style="vertical-align:middle;margin-right:6px"> ${this.translate.instant('ETABLISSEMENT.TYPES.COORDINATION')}</div>
          <div><img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" height="16" style="vertical-align:middle;margin-right:6px"> ${this.translate.instant('ETABLISSEMENT.TYPES.AUTRE')}</div>
          <hr style="margin:8px 0;border:none;border-top:1px solid #eee">
          <div><span style="display:inline-block;width:16px;height:2px;background:#fff;margin-right:6px;vertical-align:middle"></span> ${this.translate.instant('ETABLISSEMENT.MAP.LEGEND_BORDER')}</div>
          <div><span style="display:inline-block;width:16px;height:2px;background:repeating-linear-gradient(90deg,#ffd54f 0 3px,transparent 3px 5px);margin-right:6px;vertical-align:middle"></span> ${this.translate.instant('ETABLISSEMENT.MAP.LEGEND_REGION')}</div>
          <div><span style="display:inline-block;width:16px;height:2px;background:repeating-linear-gradient(90deg,#f5f5f5 0 1px,transparent 1px 3px);margin-right:6px;vertical-align:middle"></span> ${this.translate.instant('ETABLISSEMENT.MAP.LEGEND_PROVINCE')}</div>
          <div><span style="display:inline-block;width:16px;height:3px;background:#ffb300;margin-right:6px;vertical-align:middle"></span> ${this.translate.instant('ETABLISSEMENT.MAP.LEGEND_ROAD')}</div>
        </div>
      `;
      return div;
    };
    legend.addTo(this.map);
  }

  applyFilter() {
    this.filtered = this.all.filter(e => {
      const type = !this.selectedType || e.typeLocal === this.selectedType;
      const milieu = !this.selectedMilieu || e.milieu === this.selectedMilieu;
      return type && milieu && e.latitude && e.longitude;
    });
    if (this.map && this.markersLayer) this.renderMarkers();
  }

  renderMarkers() {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();
    this.filtered.forEach(e => {
      const icon = this.icons[e.typeLocal || ''] || this.icons['DEFAULT'];
      const marker = L.marker([e.latitude!, e.longitude!], { icon });
      marker.bindPopup(`
        <div style="min-width:200px;font-family:Arial,sans-serif">
          <strong style="color:#2e7d32;font-size:14px">${e.nomFr}</strong>
          <div style="color:#666;font-size:12px">${e.nomAr || ''}</div>
          <hr style="margin:8px 0;border:none;border-top:1px solid #eee">
          <table style="font-size:12px;width:100%;border-collapse:collapse">
            <tr><td style="color:#888;padding:2px 0">${this.translate.instant('ETABLISSEMENT.PROVINCE')}</td><td><strong>${e.provinceNom || '-'}</strong></td></tr>
            <tr><td style="color:#888;padding:2px 0">${this.translate.instant('ETABLISSEMENT.TYPE_LOCAL')}</td><td>${this.formatType(e.typeLocal)}</td></tr>
            <tr><td style="color:#888;padding:2px 0">${this.translate.instant('ETABLISSEMENT.MILIEU')}</td><td>${e.milieu ? this.translate.instant('ETABLISSEMENT.MILIEUX.' + e.milieu) : '-'}</td></tr>
            <tr><td style="color:#888;padding:2px 0">${this.translate.instant('ETABLISSEMENT.CAPACITE')}</td><td>${e.capaciteAccueil || '-'}</td></tr>
            <tr><td style="color:#888;padding:2px 0">${this.translate.instant('ETABLISSEMENT.TELEPHONE')}</td><td>${e.telephone || '-'}</td></tr>
          </table>
          <div style="margin-top:10px;text-align:center">
            <a href="/etablissements/${e.id}"
               style="background:#2e7d32;color:white;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px">
              ${this.translate.instant('ETABLISSEMENT.MAP.VIEW_DETAILS')}
            </a>
          </div>
        </div>
      `, { maxWidth: 260 });
      this.markersLayer.addLayer(marker);
    });
  }

  formatType(type: string | undefined): string {
    return type ? this.translate.instant('ETABLISSEMENT.TYPES.' + type) : '-';
  }
}
