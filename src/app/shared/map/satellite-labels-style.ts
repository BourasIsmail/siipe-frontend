import type { StyleSpecification } from 'maplibre-gl';

/**
 * MapLibre style rendering only labels/boundaries from OpenFreeMap's OpenMapTiles
 * data (no basemap fill), meant to sit on top of a satellite raster layer.
 * Arabic names are preferred via coalesce(name:ar, name:fr, name); colors are
 * chosen for legibility over imagery rather than a flat background.
 */
export function buildSatelliteLabelsStyle(): StyleSpecification {
  const nameField = ['coalesce', ['get', 'name:ar'], ['get', 'name:fr'], ['get', 'name']];

  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet'
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
          'line-color': '#f5f5f5',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 10, 1],
          'line-dasharray': [2, 2],
          'line-opacity': 0.6
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
      },
      {
        id: 'place-state',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 4,
        filter: ['==', ['get', 'class'], 'state'],
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
      }
    ]
  } as StyleSpecification;
}

export const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
