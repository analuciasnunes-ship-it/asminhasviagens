import { Meal, Participant } from "@/types/trip";
import { UtensilsCrossed, Star, Trash2 } from "lucide-react";

interface Props {
  meal: Meal;
  participants: Participant[];
  onDelete: (id: string) => void;
  onUpdate: (meal: Meal) => void;
}

export function MealCard({ meal, participants, onDelete, onUpdate }: Props) {
  const payer = participants.find((p) => p.id === meal.paidBy);
  const sharers = participants.filter((p) => meal.sharedBy.includes(p.id));
  const perPerson = meal.totalBill / (meal.sharedBy.length || 1);

  return (
    <div className="rounded-xl border border-border bg-card transition-all duration-200 shadow-sm">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <UtensilsCrossed size={14} className="text-warning" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-foreground">{meal.restaurantName}</h4>
              <p className="text-xs text-muted-foreground">{meal.totalBill.toFixed(2)}€</p>
            </div>
          </div>
          <button onClick={() => onDelete(meal.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Pago por <span className="font-medium text-foreground">{payer?.name || "?"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Dividido: {sharers.map((s) => s.name).join(", ")} · {perPerson.toFixed(2)}€/pessoa
          </p>
          {meal.notes && (
            <p className="text-xs text-muted-foreground italic">{meal.notes}</p>
          )}
        </div>

        {meal.rating !== undefined && meal.rating > 0 && (
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => onUpdate({ ...meal, rating: s })}>
                <Star
                  size={14}
                  className={`transition-colors ${
                    (meal.rating || 0) >= s ? "text-warning fill-warning" : "text-muted-foreground/20"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
        {(meal.rating === undefined || meal.rating === 0) && (
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => onUpdate({ ...meal, rating: s })}>
                <Star size={14} className="text-muted-foreground/20 transition-colors hover:text-warning" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
