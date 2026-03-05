import { DayPlan } from "@/types/trip";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
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
  const dateLabel = format(new Date(day.date), "EEE, d MMM", { locale: pt });
  const activityCount = day.activities.length;
  const dayCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);

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
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Dia {day.dayNumber}
            </h3>
            {day.title && !editing && (
              <span className="text-sm text-muted-foreground truncate">
                – {day.title}
              </span>
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

      {editing && (
        <div
          className="mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            autoFocus
            placeholder="Ex: Montmartre"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            className="text-sm h-8"
          />
        </div>
      )}

      {!editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="mt-2 text-xs text-primary/60 hover:text-primary transition-colors"
        >
          {day.title ? "Editar título" : "+ Adicionar título"}
        </button>
      )}
    </button>
  );
}
