'use client';

import { useEffect, useRef } from 'react';
import { Project } from '@/lib/types';
import { STATUS_COLORS, TYPE_EMOJI } from '@/lib/utils';

interface MapProps {
  projects: Project[];
  selectedId: number | null;
  onSelect: (project: Project) => void;
}

export default function Map({ projects, selectedId, onSelect }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<globalThis.Map<number, any>>(new globalThis.Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const init = async () => {
      const L = (await import('leaflet')).default;

      const map = L.map(mapRef.current!, {
        center: [10.85, 76.27],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;

      // Use plain layer group
      const group = L.layerGroup();
      group.addTo(map);
      clusterGroupRef.current = group;

      addMarkers(L, projects, group);
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current.clear();
        clusterGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when projects change
  useEffect(() => {
    if (!leafletMapRef.current || !clusterGroupRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      clusterGroupRef.current.clearLayers();
      markersRef.current.clear();
      addMarkers(L, projects, clusterGroupRef.current);
    };

    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Fly to selected project
  useEffect(() => {
    if (!leafletMapRef.current || selectedId === null) return;
    const project = projects.find((p) => p.id === selectedId);
    if (project?.lat && project?.lng) {
      leafletMapRef.current.flyTo([project.lat, project.lng], 15, { duration: 1.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addMarkers(L: any, projs: Project[], group: any) {
    projs.forEach((p) => {
      if (!p.lat || !p.lng) return;

      const color = STATUS_COLORS[p.status] || '#888';
      const emoji = TYPE_EMOJI[p.type] || '📍';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
        "><span style="transform: rotate(45deg); font-size: 13px; display: block; margin-top: 2px; margin-left: 2px;">${emoji}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([p.lat, p.lng], { icon });

      marker.bindPopup(`
        <div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${emoji} ${p.name}</div>
          <div style="font-size: 11px; color: #888;">🏗 ${p.contractor}</div>
          <div style="font-size: 11px; color: #888;">📍 ${p.ward}</div>
          <div style="font-size: 11px; color: ${color}; margin-top: 4px; text-transform: capitalize;">${p.status}</div>
        </div>
      `);

      marker.on('click', () => {
        onSelect(p);
      });

      group.addLayer(marker);
      markersRef.current.set(p.id, marker);
    });
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ background: '#0e1117' }}
    />
  );
}
