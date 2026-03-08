import { useState } from "react";
import { Expense, Participant } from "@/types/trip";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ExpensePaymentsList, PaymentStatusBadge } from "./ExpensePaymentsList";
import { ShoppingCart, Receipt, Trash2, Pencil } from "lucide-react";

interface Props {
  expense: Expense;
  participants: Participant[];
  onDelete: (id: string) => void;
  onUpdate?: (expense: Expense) => void;
}

export function ExpenseCard({ expense, participants, onDelete, onUpdate }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const payer = participants.find((p) => p.id === expense.paidBy);
  const sharers = participants.filter((p) => expense.sharedBy.includes(p.id));
  const perPerson = expense.amount / (expense.sharedBy.length || 1);
  const Icon = expense.type === "supermarket" ? ShoppingCart : Receipt;
  const hasPaymentPlan = expense.expensePayments && expense.expensePayments.length > 0;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-foreground">{expense.description}</h4>
              <p className="text-xs text-muted-foreground">{expense.amount.toFixed(2)}€</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onUpdate && (
              <button onClick={() => setEditOpen(true)} className="text-muted-foreground/40 hover:text-primary transition-colors">
                <Pencil size={14} />
              </button>
            )}
            <button onClick={() => onDelete(expense.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Pago por <span className="font-medium text-foreground">{payer?.name || "?"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Dividido: {sharers.map((s) => s.name).join(", ")} · {perPerson.toFixed(2)}€/pessoa
          </p>
          {expense.notes && (
            <p className="text-xs text-muted-foreground italic mt-1">{expense.notes}</p>
          )}
        </div>

        {/* Payment status badge */}
        {hasPaymentPlan && (
          <div className="mt-2">
            <PaymentStatusBadge totalAmount={expense.amount} payments={expense.expensePayments} />
          </div>
        )}

        {/* Payments section */}
        {onUpdate && (
          <div className="mt-2 pt-2 border-t border-border/40">
            {showPayments || hasPaymentPlan ? (
              <ExpensePaymentsList
                totalAmount={expense.amount}
                payments={expense.expensePayments || []}
                participants={participants}
                onChange={(payments) => onUpdate({ ...expense, expensePayments: payments })}
              />
            ) : (
              <button
                onClick={() => setShowPayments(true)}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                + Gerir pagamentos parciais
              </button>
            )}
          </div>
        )}
      </div>

      {onUpdate && (
        <AddExpenseDialog
          participants={participants}
          expenseType={expense.type}
          onAdd={onUpdate}
          editExpense={expense}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
