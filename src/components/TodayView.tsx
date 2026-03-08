import { Trip, DayPlan, Activity, DURATION_OPTIONS } from "@/types/trip";
import { ActivityTimeline } from "./ActivityTimeline";
import { isToday, format } from "date-fns";
import { pt } from "date-fns/locale";
import { MapPin, Clock, ChevronRight, CalendarOff } from "lucide-react";

function getMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getDurationMinutes(a: Activity): number {
  if (!a.estimatedDuration) return 60; // default 1h
  const opt = DURATION_OPTIONS.find((o) => o.label === a.estimatedDuration);
  return opt?.minutes || 60;
}

function findCurrentAndNext(activities: Activity[]) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const timed = activities
    .filter((a) => a.time)
    .sort((a, b) => a.time!.localeCompare(b.time!));

  let current: Activity | null = null;
  let next: Activity | null = null;

  for (let i = 0; i < timed.length; i++) {
    const start = getMinutes(timed[i].time!);
    const end = start + getDurationMinutes(timed[i]);

    if (nowMin >= start && nowMin < end) {
      current = timed[i];
      next = timed[i + 1] || null;
      break;
    }
    if (nowMin < start) {
      next = timed[i];
      break;
    }
  }

  // If past all activities, show last as current
  if (!current && !next && timed.length > 0) {
    const last = timed[timed.length - 1];
    const lastEnd = getMinutes(last.time!) + getDurationMinutes(last);
    if (nowMin >= lastEnd) {
      current = last;
    }
  }

  return { current, next };
}

interface Props {
  trip: Trip;
  onUpdateActivity: (dayId: string, activity: Activity) => void;
  onDeleteActivity: (dayId: string, activityId: string) => void;
}

export function TodayView({ trip, onUpdateActivity, onDeleteActivity }: Props) {
  const todayDay = trip.days.find((d) => isToday(new Date(d.date)));

  if (!todayDay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarOff size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Não há plano para hoje.</p>
        <p className="text-muted-foreground/50 text-xs mt-1">
          O modo Hoje mostra as atividades do dia atual.
        </p>
      </div>
    );
  }

  const { current, next } = findCurrentAndNext(todayDay.activities);
  const dayLabel = format(new Date(todayDay.date), "EEEE, d MMMM", { locale: pt });

  return (
    <div className="space-y-4">
      {/* Date label */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {dayLabel}
      </p>

      {/* Now / Next cards */}
      <div className="space-y-2">
        {current && (
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Agora
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin size={13} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">
                  {current.name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums ml-auto shrink-0">
                  {current.time}
                </span>
              </div>
            </div>
          </div>
        )}

        {next && (
          <div className="flex items-center gap-3 rounded-xl bg-secondary/60 border border-border px-4 py-3">
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                A seguir
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={13} className="text-muted-foreground/60 shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {next.name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums ml-auto shrink-0">
                  {next.time}
                </span>
              </div>
            </div>
          </div>
        )}

        {!current && !next && (
          <p className="text-sm text-muted-foreground/60 italic">
            Nenhuma atividade com hora definida para hoje.
          </p>
        )}
      </div>

      {/* Full timeline */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cronograma
        </h3>
        <ActivityTimeline
          activities={todayDay.activities}
          meals={todayDay.meals}
          expenses={todayDay.expenses}
          participants={trip.participants}
          onUpdate={(a) => onUpdateActivity(todayDay.id, a)}
          onDelete={(id) => onDeleteActivity(todayDay.id, id)}
          onReorder={() => {}}
        />
      </div>
    </div>
  );
}
