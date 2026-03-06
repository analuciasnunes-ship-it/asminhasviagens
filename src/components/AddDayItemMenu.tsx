import { useState } from "react";
import { Plus, MapPin, UtensilsCrossed, ShoppingCart, Receipt } from "lucide-react";
import { Activity, Meal, Expense, Participant } from "@/types/trip";
import { AddActivityDialog } from "./AddActivityDialog";
import { AddMealDialog } from "./AddMealDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface Props {
  participants: Participant[];
  onAddActivity: (activity: Activity) => void;
  onAddMeal: (meal: Meal) => void;
  onAddExpense: (expense: Expense) => void;
}

export function AddDayItemMenu({ participants, onAddActivity, onAddMeal, onAddExpense }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const hasParticipants = participants.length > 0;

  return (
    <div className="space-y-2">
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 rounded-lg border border-dashed border-border hover:border-primary/30"
        >
          <Plus size={14} /> Adicionar item
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Tipo de item</span>
            <button onClick={() => setShowMenu(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AddActivityDialog
              onAdd={(a) => { onAddActivity(a); setShowMenu(false); }}
              participants={participants}
              trigger={
                <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-center">
                  <MapPin size={18} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">Atividade</span>
                </button>
              }
            />
            {hasParticipants && (
              <AddMealDialog
                participants={participants}
                onAdd={(m) => { onAddMeal(m); setShowMenu(false); }}
                trigger={
                  <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-center">
                    <UtensilsCrossed size={18} className="text-warning" />
                    <span className="text-xs font-medium text-foreground">Refeição</span>
                  </button>
                }
              />
            )}
            {hasParticipants && (
              <AddExpenseDialog
                participants={participants}
                expenseType="supermarket"
                onAdd={(e) => { onAddExpense(e); setShowMenu(false); }}
                trigger={
                  <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-center">
                    <ShoppingCart size={18} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Supermercado</span>
                  </button>
                }
              />
            )}
            {hasParticipants && (
              <AddExpenseDialog
                participants={participants}
                expenseType="other"
                onAdd={(e) => { onAddExpense(e); setShowMenu(false); }}
                trigger={
                  <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-center">
                    <Receipt size={18} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Outra despesa</span>
                  </button>
                }
              />
            )}
          </div>
          {!hasParticipants && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              Adiciona participantes à viagem para partilhar despesas
            </p>
          )}
        </div>
      )}
    </div>
  );
}
