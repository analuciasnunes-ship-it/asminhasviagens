import { Participant } from "@/types/trip";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ExpenseSplitFieldsProps {
  participants: Participant[];
  paidBy: string;
  sharedBy: string[];
  onPaidByChange: (id: string) => void;
  onSharedByChange: (ids: string[]) => void;
  /** Allow deselecting paidBy by clicking again (used in activity dialog) */
  allowDeselect?: boolean;
  /** Show per-person amount */
  totalAmount?: number;
  /** Label variant: use "required" to show asterisks */
  required?: boolean;
}

export function ExpenseSplitFields({
  participants,
  paidBy,
  sharedBy,
  onPaidByChange,
  onSharedByChange,
  allowDeselect = false,
  totalAmount,
  required = false,
}: ExpenseSplitFieldsProps) {
  if (participants.length === 0) return null;

  const toggleShared = (id: string) => {
    onSharedByChange(
      sharedBy.includes(id) ? sharedBy.filter((x) => x !== id) : [...sharedBy, id]
    );
  };

  const perPerson =
    totalAmount && totalAmount > 0 && sharedBy.length > 0
      ? totalAmount / sharedBy.length
      : 0;

  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Quem pagou{required ? " *" : ""}</Label>
        <div className="flex flex-wrap gap-1.5">
          {participants.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                onPaidByChange(allowDeselect && paidBy === p.id ? "" : p.id)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                paidBy === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Dividir entre{required ? " *" : ""}</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSharedByChange(participants.map((p) => p.id))}
              className="text-[11px] text-primary hover:underline"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onSharedByChange([])}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {participants.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={sharedBy.includes(p.id)}
                onCheckedChange={() => toggleShared(p.id)}
              />
              <span className="text-foreground">{p.name}</span>
            </label>
          ))}
        </div>
        {perPerson > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {perPerson.toFixed(2)}€ por pessoa
          </p>
        )}
      </div>
    </>
  );
}
