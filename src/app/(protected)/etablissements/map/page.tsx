'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/apiClient';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import type { EtablissementCentre } from '@/lib/models/etablissement.model';

export default function EtablissementsMapPage() {
  const { t } = useI18n();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const iconsRef = useRef<Record<string, any> | null>(null);

  const [all, setAll] = useState<EtablissementCentre[]>([]);
  const [filtered, setFiltered] = useState<EtablissementCentre[]>([]);
  const [noCoordsList, setNoCoordsList] = useState<EtablissementCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedMilieu, setSelectedMilieu] = useState('');
  const [total, setTotal] = useState(0);
  const [withCoords, setWithCoords] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // Fetch data
  useEffect(() => {
    api.getEtablissements()
      .then((data: EtablissementCentre[]) => {
        setAll(data);
        setTotal(data.length);
        setWithCoords(data.filter(e => e.latitude && e.longitude).length);
        setNoCoordsList(data.filter(e => !e.latitude || !e.longitude));
        setLoading(false);
      })
      .catch((e) => {
        console.error('API error:', e);
        setLoading(false);
      });
  }, []);

  // Init map (client-only, once)
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled || mapRef.current || !mapDivRef.current) return;

      const L = (await import('leaflet')).default;
      await import('@maplibre/maplibre-gl-leaflet');
      const { buildSatelliteLabelsStyle, ESRI_WORLD_IMAGERY_URL } = await import('@/lib/map/satelliteLabelsStyle');

      if (cancelled || !mapDivRef.current) return;

      const icons: Record<string, any> = {
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
        })
      };
      iconsRef.current = icons;

      const map = L.map(mapDivRef.current, { zoomControl: true }).setView([31.7917, -7.0926], 6);
      mapRef.current = map;

      L.tileLayer(ESRI_WORLD_IMAGERY_URL, {
        attribution: 'Imagery © Esri',
        maxZoom: 19
      }).addTo(map);

      (L as any).maplibreGL({
        style: buildSatelliteLabelsStyle(),
        interactive: false
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      // Legend
      const legend = (L as any).control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div');
        div.innerHTML = `
          <div style="background:white;padding:12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:12px;line-height:1.8">
            <strong style="display:block;margin-bottom:6px;color:#2e7d32">${t('ETABLISSEMENT.MAP.LEGEND')}</strong>
            <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" height="16" style="vertical-align:middle;margin-inline-end:6px"> ${t('ETABLISSEMENT.TYPES.CENTRE_SOCIALE')}</div>
            <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" height="16" style="vertical-align:middle;margin-inline-end:6px"> ${t('ETABLISSEMENT.TYPES.DELEGATION')}</div>
            <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" height="16" style="vertical-align:middle;margin-inline-end:6px"> ${t('ETABLISSEMENT.TYPES.COORDINATION')}</div>
            <div><img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" height="16" style="vertical-align:middle;margin-inline-end:6px"> ${t('ETABLISSEMENT.TYPES.AUTRE')}</div>
            <hr style="margin:8px 0;border:none;border-top:1px solid #eee">
            <div><span style="display:inline-block;width:16px;height:2px;background:#fff;margin-inline-end:6px;vertical-align:middle"></span> ${t('ETABLISSEMENT.MAP.LEGEND_BORDER')}</div>
            <div><span style="display:inline-block;width:16px;height:2px;background:repeating-linear-gradient(90deg,#ffd54f 0 3px,transparent 3px 5px);margin-inline-end:6px;vertical-align:middle"></span> ${t('ETABLISSEMENT.MAP.LEGEND_REGION')}</div>
            <div><span style="display:inline-block;width:16px;height:2px;background:repeating-linear-gradient(90deg,#f5f5f5 0 1px,transparent 1px 3px);margin-inline-end:6px;vertical-align:middle"></span> ${t('ETABLISSEMENT.MAP.LEGEND_PROVINCE')}</div>
            <div><span style="display:inline-block;width:16px;height:3px;background:#ffb300;margin-inline-end:6px;vertical-align:middle"></span> ${t('ETABLISSEMENT.MAP.LEGEND_ROAD')}</div>
          </div>
        `;
        return div;
      };
      legend.addTo(map);

      setMapReady(true);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filter whenever data/filters change
  useEffect(() => {
    const next = all.filter(e => {
      const typeMatch = !selectedType || e.typeLocal === selectedType;
      const milieuMatch = !selectedMilieu || e.milieu === selectedMilieu;
      return typeMatch && milieuMatch && e.latitude && e.longitude;
    });
    setFiltered(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, selectedType, selectedMilieu]);

  // Render markers whenever filtered list or map readiness changes
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || !iconsRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default;
      const icons = iconsRef.current!;
      const markersLayer = markersLayerRef.current;

      markersLayer.clearLayers();
      filtered.forEach(e => {
        const icon = icons[e.typeLocal || ''] || icons['DEFAULT'];
        const marker = L.marker([e.latitude!, e.longitude!], { icon });
        marker.bindPopup(`
          <div style="min-width:200px;font-family:Arial,sans-serif">
            <strong style="color:#2e7d32;font-size:14px">${e.nomFr}</strong>
            <div style="color:#666;font-size:12px">${e.nomAr || ''}</div>
            <hr style="margin:8px 0;border:none;border-top:1px solid #eee">
            <table style="font-size:12px;width:100%;border-collapse:collapse">
              <tr><td style="color:#888;padding:2px 0">${t('ETABLISSEMENT.PROVINCE')}</td><td><strong>${e.provinceNom || '-'}</strong></td></tr>
              <tr><td style="color:#888;padding:2px 0">${t('ETABLISSEMENT.TYPE_LOCAL')}</td><td>${e.typeLocal ? t('ETABLISSEMENT.TYPES.' + e.typeLocal) : '-'}</td></tr>
              <tr><td style="color:#888;padding:2px 0">${t('ETABLISSEMENT.MILIEU')}</td><td>${e.milieu ? t('ETABLISSEMENT.MILIEUX.' + e.milieu) : '-'}</td></tr>
              <tr><td style="color:#888;padding:2px 0">${t('ETABLISSEMENT.CAPACITE')}</td><td>${e.capaciteAccueil || '-'}</td></tr>
              <tr><td style="color:#888;padding:2px 0">${t('ETABLISSEMENT.TELEPHONE')}</td><td>${e.telephone || '-'}</td></tr>
            </table>
            <div style="margin-top:10px;text-align:center">
              <a href="/etablissements/${e.id}"
                 style="background:#2e7d32;color:white;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px">
                ${t('ETABLISSEMENT.MAP.VIEW_DETAILS')}
              </a>
            </div>
          </div>
        `, { maxWidth: 260 });
        markersLayer.addLayer(marker);
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, mapReady]);

  return (
    <div>
      <div className="page-header">
        <h1>{t('ETABLISSEMENT.MAP.TITLE')}</h1>
        <Link className="btn btn-outline" href="/etablissements">
          <Icon name="list" /> {t('ETABLISSEMENT.MAP.LIST_VIEW')}
        </Link>
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat">
          <Icon name="business" />
          <span><strong>{total}</strong> {t('ETABLISSEMENT.MAP.TOTAL')}</span>
        </div>
        <div className="stat">
          <Icon name="location_on" />
          <span><strong>{withCoords}</strong> {t('ETABLISSEMENT.MAP.GEOLOCATED')}</span>
        </div>
        <div className="stat">
          <Icon name="location_off" />
          <span><strong>{total - withCoords}</strong> {t('ETABLISSEMENT.MAP.NO_COORDS')}</span>
        </div>
        <div className="filter-group">
          <label>{t('ETABLISSEMENT.MAP.FILTER_TYPE')}</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">{t('COMMON.ALL')}</option>
            <option value="CENTRE_SOCIALE">{t('ETABLISSEMENT.TYPES.CENTRE_SOCIALE')}</option>
            <option value="DELEGATION">{t('ETABLISSEMENT.TYPES.DELEGATION')}</option>
            <option value="COORDINATION">{t('ETABLISSEMENT.TYPES.COORDINATION')}</option>
            <option value="DEPOT">{t('ETABLISSEMENT.TYPES.DEPOT')}</option>
            <option value="AUTRE">{t('ETABLISSEMENT.TYPES.AUTRE')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t('ETABLISSEMENT.MAP.FILTER_MILIEU')}</label>
          <select value={selectedMilieu} onChange={(e) => setSelectedMilieu(e.target.value)}>
            <option value="">{t('COMMON.ALL')}</option>
            <option value="URBAIN">{t('ETABLISSEMENT.MILIEUX.URBAIN')}</option>
            <option value="RURAL">{t('ETABLISSEMENT.MILIEUX.RURAL')}</option>
          </select>
        </div>
      </div>

      {/* Map always visible, spinner overlay when loading */}
      <div className="siipe-card map-card">
        <div style={{ padding: 0, position: 'relative' }}>
          {loading && (
            <div className="map-loading">
              <div className="spinner" />
            </div>
          )}
          <div ref={mapDivRef} className="main-map" />
        </div>
      </div>

      {/* No coords warning */}
      {noCoordsList.length > 0 && (
        <div className="no-coords-panel">
          <h3>
            <Icon name="warning" />
            {t('ETABLISSEMENT.MAP.NO_COORDS_WARNING')} ({noCoordsList.length})
          </h3>
          <div className="no-coords-list">
            {noCoordsList.map(e => (
              <div className="no-coords-item" key={e.id}>
                <span>{e.nomFr}</span>
                <span className="text-secondary">{e.provinceNom || '-'}</span>
                <Link href={`/etablissements/${e.id}/edit`} className="link">{t('ETABLISSEMENT.MAP.ADD_COORDS')}</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .stats-bar {
          display: flex; align-items: center; gap: 24px;
          background: var(--color-white); padding: 12px 20px; border-radius: var(--radius-md);
          margin-bottom: 16px; box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .stat {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; color: var(--color-text-secondary);
        }
        .stat :global(.material-icons) { color: var(--color-primary); font-size: 20px; width: 20px; height: 20px; }
        .stat strong { color: var(--color-primary); }
        .filter-group {
          display: flex; align-items: center; gap: 8px; margin-inline-start: auto;
        }
        .filter-group label { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }
        .filter-group select {
          padding: 6px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          font-size: 13px; font-family: inherit; background: var(--color-white);
        }
        .map-card {
          padding: 0 !important;
          overflow: hidden;
          border-radius: var(--radius-lg) !important;
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
        .no-coords-panel {
          margin-top: 16px; background: var(--color-white); border-radius: var(--radius-md);
          padding: 16px 20px; box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }
        .no-coords-panel h3 {
          display: flex; align-items: center; gap: 8px;
          color: var(--color-accent); font-size: 14px; margin-bottom: 12px;
        }
        .no-coords-panel h3 :global(.material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .no-coords-list {
          display: flex; flex-direction: column; gap: 8px;
          max-height: 200px; overflow-y: auto;
        }
        .no-coords-item {
          display: flex; align-items: center; gap: 16px;
          padding: 8px 12px; background: var(--color-accent-surface); border-radius: var(--radius-sm); font-size: 13px;
        }
        /* .link targets next/link's <Link> (a custom component) — styled-jsx
           only auto-scopes native tags, so this must be :global() or it silently never matches. */
        :global(.link) { color: var(--color-primary); text-decoration: none; margin-inline-start: auto; font-size: 12px; }
        :global(.link:hover) { text-decoration: underline; }
      `}</style>
    </div>
  );
}
