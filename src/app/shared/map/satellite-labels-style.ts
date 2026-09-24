import { addProtocol, type StyleSpecification } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { environment } from '../../../environments/environment';

// Runs once, the first time this module is imported (only by the two lazy
// map routes), so maplibre-gl/pmtiles never land in the app's initial bundle.
// Lets the "pmtiles://" source url below read vector tiles directly from a
// single static .pmtiles file over HTTP range requests.
const pmtilesProtocol = new Protocol();
addProtocol('pmtiles', pmtilesProtocol.tile);

/**
 * MapLibre style rendering only boundaries/roads/labels (no basemap fill),
 * meant to sit on top of a satellite raster layer. Vector data comes from a
 * self-hosted PMTiles archive built with Planetiler from the org's own edited
 * maroc_complet_neutre.osm.pbf (so the Morocco/Western Sahara border matches
 * that file, not upstream OSM). Arabic names are preferred via
 * coalesce(name:ar, name:fr, name); colors are chosen for legibility over
 * imagery rather than a flat background.
 */
export function buildSatelliteLabelsStyle(): StyleSpecification {
  const nameField = ['coalesce', ['get', 'name:ar'], ['get', 'name:fr'], ['get', 'name']];

  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: {
        type: 'vector',
        url: `pmtiles://${environment.tilesUrl}`
      }
    },
    layers: [
      {
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['<=', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 8, 2.2],
          'line-opacity': 0.9
        }
      },
      {
        id: 'boundary-region',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        minzoom: 5,
        filter: ['all', ['>', ['get', 'admin_level'], 2], ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
        paint: {
          'line-color': '#ffd54f',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 10, 1.3],
          'line-dasharray': [3, 2],
          'line-opacity': 0.75
        }
      },
      {
        id: 'boundary-province',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        minzoom: 7,
        filter: ['all', ['>', ['get', 'admin_level'], 4], ['<=', ['get', 'admin_level'], 6], ['!=', ['get', 'maritime'], 1]],
        paint: {
          'line-color': '#f5f5f5',
          'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.3, 12, 1],
          'line-dasharray': [1, 2],
          'line-opacity': 0.55
        }
      },
      {
        id: 'roads-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 9,
        filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
        paint: {
          'line-color': '#ffe082',
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 14, 1.8],
          'line-opacity': 0.75
        }
      },
      {
        id: 'roads-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 6,
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
        paint: {
          'line-color': '#ffb300',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 2.5, 16, 5],
          'line-opacity': 0.9
        }
      },
      {
        id: 'transportation-name',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'text-field': nameField as any,
          'text-font': ['Noto Sans Regular'],
          'symbol-placement': 'line',
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#1a1a1a',
          'text-halo-width': 1.4
        }
      },
      {
        id: 'place-region',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 4,
        filter: ['match', ['get', 'class'], ['state', 'region'], true, false],
        layout: {
          'text-field': nameField as any,
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-letter-spacing': 0.1
        },
        paint: {
          'text-color': '#f0f0f0',
          'text-halo-color': '#1a1a1a',
          'text-halo-width': 1.2
        }
      },
      {
        id: 'place-city',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 5,
        filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
        layout: {
          'text-field': nameField as any,
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 12, 15]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#1a1a1a',
          'text-halo-width': 1.3
        }
      },
      {
        id: 'place-country',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'country'],
        layout: {
          'text-field': nameField as any,
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 16]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#1a1a1a',
          'text-halo-width': 1.6
        }
      }
    ]
  } as StyleSpecification;
}

export const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/**
 * Esri World Street Map raster tiles. Labels/roads/place names are baked into the
 * tiles themselves, so this is used on its own (no separate vector label overlay).
 */
export const ARCGIS_STREET_MAP_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
