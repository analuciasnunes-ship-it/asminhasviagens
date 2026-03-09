import { DayPlan } from "@/types/trip";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronRight, MapPin, Pencil } from "lucide-react";
import { getDayColor } from "@/lib/dayColors";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  day: DayPlan;
  tripId: string;
  onUpdateTitle: (dayId: string, title: string) => void;
  onClick: () => void;
}

export function DayOverviewCard({ day, tripId, onUpdateTitle, onClick }: Props) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(day.title || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const dateLabel = format(new Date(day.date), "EEE, d MMM", { locale: pt });
  const activityCount = day.activities.length;
  const dayCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editing]);

  const handleSaveTitle = () => {
    onUpdateTitle(day.id, titleDraft.trim());
    setEditing(false);
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all active:scale-[0.98] animate-fade-in"
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        {/* Day number badge */}
        <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {day.dayNumber}
        </span>

        {/* Title area */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                placeholder="Ex: Montmartre"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") { setTitleDraft(day.title || ""); setEditing(false); }
                }}
                className="text-sm h-8"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-semibold text-foreground truncate">
                {day.title || `Dia ${day.dayNumber}`}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Editar título"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{dateLabel}</p>
        </div>

        <ChevronRight size={18} className="text-muted-foreground/30 shrink-0" />
      </div>

      {/* Stats row */}
      {(activityCount > 0 || dayCost > 0) && (
        <div className="ml-12 mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={11} />
          <span>
            {activityCount} {activityCount === 1 ? "atividade" : "atividades"}
            {dayCost > 0 && ` · ${dayCost.toFixed(0)}€`}
          </span>
        </div>
      )}
    </button>
  );
}
