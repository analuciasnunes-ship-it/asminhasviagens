import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trip, Activity, Participant } from "@/types/trip";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { geocodeLocation } from "@/lib/geocode";
import { getDayColor } from "@/lib/dayColors";
import { ActivityCard } from "./ActivityCard";

// Fix default marker icons for Leaflet in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MarkerActivity {
  activity: Activity;
  dayNumber: number;
  dayId: string;
  indexInDay: number;
}

interface Props {
  trip: Trip;
  onNavigateToDay?: (dayId: string, activityId?: string) => void;
  onUpdateActivity?: (dayId: string, activity: Activity) => void;
  onDeleteActivity?: (dayId: string, activityId: string) => void;
}

export function TripMapView({ trip, onNavigateToDay, onUpdateActivity, onDeleteActivity }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Collect all activities with locations
  const allMarkerActivities = useMemo<MarkerActivity[]>(() => {
    const items: MarkerActivity[] = [];
    trip.days.forEach((day) => {
      let idx = 0;
      day.activities.forEach((a) => {
        if (a.location) {
          idx++;
          items.push({ activity: a, dayNumber: day.dayNumber, dayId: day.id, indexInDay: idx });
        }
      });
    });
    return items;
  }, [trip.days]);

  const filteredActivities = selectedDay !== null
    ? allMarkerActivities.filter((m) => m.dayNumber === selectedDay)
    : allMarkerActivities;

  const dayNumbers = useMemo(() => {
    const nums = new Set<number>();
    allMarkerActivities.forEach((m) => nums.add(m.dayNumber));
    return Array.from(nums).sort((a, b) => a - b);
  }, [allMarkerActivities]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current).setView([48.8566, 2.3522], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMap.current);
    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update markers when filter changes
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    setLoading(true);

    const addMarkers = async () => {
      const bounds: L.LatLngTuple[] = [];

      await Promise.all(
        filteredActivities.map(async ({ activity, dayNumber, dayId, indexInDay }) => {
          // Use stored coordinates first, fallback to runtime geocoding
          let coords: [number, number] | null = null;
          if (activity.lat != null && activity.lng != null) {
            coords = [activity.lat, activity.lng];
          } else if (activity.location) {
            coords = await geocodeLocation(activity.location);
          }

          if (!coords || !markersLayer.current) return;
          bounds.push(coords);

          const markerColor = getDayColor(dayNumber);
          const icon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background:${markerColor};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${indexInDay}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker(coords, { icon }).addTo(markersLayer.current!);

          marker.on("click", () => {
            onNavigateToDay?.(dayId, activity.id);
          });

          marker.bindPopup(`
            <div style="min-width:180px;font-family:system-ui,sans-serif;">
              <p style="font-weight:600;font-size:14px;margin:0 0 4px;">${activity.title}</p>
              <p style="color:#666;font-size:12px;margin:0 0 8px;">Dia ${dayNumber}${activity.time ? ` — ${activity.time}` : ""}</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                activity.lat != null && activity.lng != null
                  ? `${activity.lat},${activity.lng}`
                  : (activity.location || '').trim()
              )}" 
                 target="_blank" rel="noopener noreferrer"
                 style="display:inline-flex;align-items:center;gap:4px;background:hsl(var(--primary));color:white;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;text-decoration:none;">
                📍 Abrir no Maps
              </a>
            </div>
          `);
        })
      );

      if (bounds.length > 0 && leafletMap.current) {
        leafletMap.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
      setLoading(false);
    };

    addMarkers();
  }, [filteredActivities]);

  if (allMarkerActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">Nenhuma localização para mostrar no mapa.</p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Adiciona uma localização às atividades para as ver no mapa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Day filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedDay(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selectedDay === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
          }`}
        >
          Todos os dias
        </button>
        {dayNumbers.map((num) => (
          <button
            key={num}
            onClick={() => setSelectedDay(selectedDay === num ? null : num)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedDay === num
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            Dia {num}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              A carregar mapa...
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-[400px] sm:h-[500px]" />
      </div>

      {/* Activity list below map */}
      <div className="space-y-1.5">
        {filteredActivities.map(({ activity, dayNumber, dayId, indexInDay }) => {
          const isExpanded = expandedActivityId === activity.id;
          return (
            <div key={activity.id}>
              <button
                onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  isExpanded
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border hover:border-primary/20"
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: getDayColor(dayNumber) }}
                >
                  {indexInDay}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.location}</p>
                </div>
                {activity.time && (
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock size={10} /> {activity.time}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
              {isExpanded && (
                <div className="mt-1 ml-9 animate-fade-in">
                  <ActivityCard
                    activity={activity}
                    participants={trip.participants || []}
                    onUpdate={(updated) => onUpdateActivity?.(dayId, updated)}
                    onDelete={(id) => {
                      onDeleteActivity?.(dayId, id);
                      setExpandedActivityId(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

