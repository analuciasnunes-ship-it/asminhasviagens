import { Trip } from "@/types/trip";
import { MapPin, Calendar, Clock } from "lucide-react";
import { format, differenceInDays, isBefore, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const today = startOfDay(new Date());
  const totalDays = differenceInDays(end, start) + 1;
  const daysUntil = differenceInDays(start, today);
  const isPast = isBefore(end, today);
  const isOngoing = !isBefore(today, start) && !isBefore(end, today);

  const formatRange = () => {
    const s = format(start, "d MMM", { locale: pt });
    const e = format(end, "d MMM", { locale: pt });
    return `${s} – ${e}`;
  };

  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="w-full text-left animate-fade-in"
    >
      <div className="rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {trip.coverImage && (
          <div className="h-36 overflow-hidden">
            <img
              src={trip.coverImage}
              alt={trip.destination}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {trip.destination}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatRange()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {totalDays} {totalDays === 1 ? "dia" : "dias"}
            </span>
          </div>
          {!isPast && !isOngoing && daysUntil > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              <Clock size={12} />
              Daqui a {daysUntil} {daysUntil === 1 ? "dia" : "dias"}
            </span>
          )}
          {isOngoing && (
            <span className="inline-flex text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
              A decorrer
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
