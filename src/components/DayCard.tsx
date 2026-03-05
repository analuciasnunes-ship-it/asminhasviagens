import { DayPlan, Activity } from "@/types/trip";
import { ActivityCard } from "./ActivityCard";
import { AddActivityDialog } from "./AddActivityDialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Props {
  day: DayPlan;
  onUpdateDay: (day: DayPlan) => void;
}

export function DayCard({ day, onUpdateDay }: Props) {
  const dateLabel = format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: pt });
  const dayCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);

  const handleAddActivity = (activity: Activity) => {
    onUpdateDay({ ...day, activities: [...day.activities, activity] });
  };

  const handleUpdateActivity = (updated: Activity) => {
    onUpdateDay({
      ...day,
      activities: day.activities.map((a) => (a.id === updated.id ? updated : a)),
    });
  };

  const handleDeleteActivity = (id: string) => {
    onUpdateDay({
      ...day,
      activities: day.activities.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Dia {day.dayNumber}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        {dayCost > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            {dayCost.toFixed(2)}€
          </span>
        )}
      </div>
      <div className="space-y-2">
        {day.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onUpdate={handleUpdateActivity}
            onDelete={handleDeleteActivity}
          />
        ))}
        <AddActivityDialog onAdd={handleAddActivity} />
      </div>
    </div>
  );
}
