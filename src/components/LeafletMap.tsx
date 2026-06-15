import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  restaurantCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
  driverCoords: { lat: number; lng: number } | null;
  driverStatus: string;
}

export default function LeafletMap({
  restaurantCoords,
  deliveryCoords,
  driverCoords,
  driverStatus,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Custom marker icons using Leaflet divIcon and Tailwind inline HTML
  const restaurantIcon = L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-amber-700 text-white border-2 border-white shadow-md flex items-center justify-center text-sm font-bold scale-110 hover:scale-125 transition-transform">
          🏨
        </div>
        <div class="px-1.5 py-0.5 bg-[#8a6538] text-white text-[9px] font-sans font-bold rounded shadow-xs whitespace-nowrap mt-1 border border-stone-200">
          Bếp Hương Việt
        </div>
      </div>
    `,
    className: '',
    iconSize: [60, 50],
    iconAnchor: [30, 42]
  });

  const deliveryIcon = L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white border-2 border-white shadow-md flex items-center justify-center text-sm font-bold scale-110 hover:scale-125 transition-transform">
          📍
        </div>
        <div class="px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] font-sans font-bold rounded shadow-xs whitespace-nowrap mt-1 border border-emerald-100">
          Khách Hàng
        </div>
      </div>
    `,
    className: '',
    iconSize: [60, 50],
    iconAnchor: [30, 42]
  });

  const getDriverIcon = (status: string) => {
    const displaysDelivered = status === 'delivered';
    return L.divIcon({
      html: `
        <div class="flex flex-col items-center justify-center">
          <div class="relative">
            <div class="absolute -inset-1.5 rounded-full bg-sky-500/40 animate-ping pointer-events-none"></div>
            <div class="w-8 h-8 rounded-full bg-sky-600 text-white border-2 border-white shadow-md flex items-center justify-center text-sm font-bold scale-110">
              🏍️
            </div>
          </div>
          <div class="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[9px] font-serif font-bold rounded border border-sky-300 shadow-xs whitespace-nowrap mt-1">
            ${displaysDelivered ? 'Đã Giao Đồ' : 'Tài xế Hương Việt'}
          </div>
        </div>
      `,
      className: '',
      iconSize: [90, 50],
      iconAnchor: [45, 42]
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map centering Hanoi Hoan Kiem
    const center = [
      (restaurantCoords.lat + deliveryCoords.lat) / 2,
      (restaurantCoords.lng + deliveryCoords.lng) / 2,
    ] as L.LatLngTuple;

    const map = L.map(containerRef.current, {
      center: center,
      zoom: 14.5,
      zoomControl: true,
      scrollWheelZoom: true,
      maxZoom: 18,
      minZoom: 12,
    });

    // Add beautiful cartoDB tile layer (clean light theme Map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Restaurant marker
    const restMarker = L.marker([restaurantCoords.lat, restaurantCoords.lng], {
      icon: restaurantIcon,
      title: 'Nhà hàng Hương Việt'
    }).addTo(map);

    // Delivery marker
    const delMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], {
      icon: deliveryIcon,
      title: 'Địa chỉ nhận hàng'
    }).addTo(map);

    restaurantMarkerRef.current = restMarker;
    deliveryMarkerRef.current = delMarker;

    // Draw scenic routing track (multi-segmented realistic delivery route through Hoan Kiem streets)
    const rawRoute = [
      [restaurantCoords.lat, restaurantCoords.lng],
      [21.0260, 105.8550], // Restaurant / Pickup zone
      [21.0270, 105.8540], // Cầu Thê Húc
      [21.0285, 105.8521], // Đinh Tiên Hoàng
      [21.0295, 105.8505], // Ngã tư Tràng Tiền - Hàng Khay
      [21.0312, 105.8495], // Lò Sũ
      [21.0325, 105.8480], // Hàng Bạc
      [21.0335, 105.8465], // Hàng Ngang
      [deliveryCoords.lat, deliveryCoords.lng], // Expected customer destination
    ];
    // Filter consecutive duplicates to guarantee a smooth and crisp coordinate path
    const routePath = rawRoute.reduce((acc, curr) => {
      if (acc.length === 0) {
        acc.push(curr);
      } else {
        const last = acc[acc.length - 1];
        const dist = Math.sqrt(Math.pow(last[0] - curr[0], 2) + Math.pow(last[1] - curr[1], 2));
        if (dist > 0.0001) {
          acc.push(curr);
        }
      }
      return acc;
    }, [] as number[][]) as L.LatLngTuple[];

    const polyline = L.polyline(routePath, {
      color: '#8a6538',
      weight: 4.5,
      opacity: 0.75,
      dashArray: '8, 10',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    polylineRef.current = polyline;
    mapRef.current = map;

    // Fit markers bound beautifully
    const groupBounds = L.latLngBounds([
      [restaurantCoords.lat, restaurantCoords.lng],
      [deliveryCoords.lat, deliveryCoords.lng]
    ]);
    map.fitBounds(groupBounds, { padding: [40, 40] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync driver coordinate updates smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverCoords) {
      const driverLatLng: L.LatLngTuple = [driverCoords.lat, driverCoords.lng];

      if (!driverMarkerRef.current) {
        // Create rider marker if not exists
        const marker = L.marker(driverLatLng, {
          icon: getDriverIcon(driverStatus),
          zIndexOffset: 1000
        }).addTo(map);
        driverMarkerRef.current = marker;
      } else {
        // Smoothly set coordinate
        driverMarkerRef.current.setLatLng(driverLatLng);
        driverMarkerRef.current.setIcon(getDriverIcon(driverStatus));
      }
    } else {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
    }
  }, [driverCoords, driverStatus]);

  // Handle auto centering map once driver coordinate ticks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverCoords) {
      // Keep everything inside bounds
      const bounds = L.latLngBounds([
        [restaurantCoords.lat, restaurantCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng],
        [driverCoords.lat, driverCoords.lng]
      ]);
      map.panTo([driverCoords.lat, driverCoords.lng], { animate: true, duration: 1 });
    }
  }, [driverCoords]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '350px' }}>
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-stone-300 z-1"
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
    </div>
  );
}
