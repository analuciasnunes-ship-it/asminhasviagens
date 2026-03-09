import { DayPlan } from "@/types/trip";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronRight, MapPin, Pencil } from "lucide-react";
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
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
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
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Dia {day.dayNumber}
            </h3>
            {editing ? (
              <div
                className="flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
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
                  className="text-sm h-7 py-0"
                />
              </div>
            ) : (
              <>
                {day.title && (
                  <span className="text-sm text-muted-foreground truncate">
                    – {day.title}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  className="shrink-0 p-1 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Editar título"
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{dateLabel}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              {activityCount} {activityCount === 1 ? "atividade" : "atividades"}
            </span>
            {dayCost > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                {dayCost.toFixed(2)}€
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground/40 shrink-0" />
      </div>
    </button>
  );
}
