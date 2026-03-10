import { Activity, Participant } from "@/types/trip";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { AddActivityDialog } from "./AddActivityDialog";

interface Props {
  activities: Activity[];
  participants: Participant[];
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onMarkerClick?: (activityId: string) => void;
}

export function DayMapView({ activities, participants, onUpdate, onDelete }: Props) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const activitiesWithLocation = activities.filter((a) => a.location);

  if (activitiesWithLocation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">
          Nenhuma atividade com localização
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Adiciona uma localização às atividades para as ver no mapa
        </p>
      </div>
    );
  }

  const openGoogleMaps = (location: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-3">
      {/* Location list as map markers */}
      <div className="space-y-2">
        {activitiesWithLocation.map((activity, index) => (
          <button
            key={activity.id}
            onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              selectedActivity?.id === activity.id
                ? "bg-primary/10 border-primary/30"
                : "bg-card border-border hover:border-primary/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Marker number */}
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {activity.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activity.location}
                </p>
                {activity.time && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock size={10} /> {activity.time}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected activity detail */}
      {selectedActivity && (
        <div className="rounded-xl border border-primary/20 bg-card p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{selectedActivity.title}</h3>
              {selectedActivity.time && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock size={11} /> {selectedActivity.time}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedActivity(null);
                setEditOpen(true);
              }}
              className="text-xs text-primary hover:underline"
            >
              Editar
            </button>
          </div>
          
          {selectedActivity.description && (
            <p className="text-sm text-muted-foreground mb-3">{selectedActivity.description}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => openGoogleMaps(selectedActivity.location!)}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <MapPin size={16} />
              Abrir no Google Maps
            </button>
            
            {selectedActivity.link && (
              <a
                href={selectedActivity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink size={16} />
                Ver link
              </a>
            )}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {selectedActivity && (
        <AddActivityDialog
          onAdd={(updated) => {
            onUpdate(updated);
            setSelectedActivity(updated);
          }}
          participants={participants}
          editActivity={selectedActivity}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
