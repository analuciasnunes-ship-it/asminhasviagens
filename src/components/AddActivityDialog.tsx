import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Activity, Participant, DURATION_OPTIONS, DurationLabel } from "@/types/trip";

interface Props {
  onAdd: (activity: Activity) => void;
  trigger?: React.ReactNode;
  participants?: Participant[];
  editActivity?: Activity;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddActivityDialog({ onAdd, trigger, participants = [], editActivity, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [link, setLink] = useState("");
  const [duration, setDuration] = useState<DurationLabel | "">("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedBy, setSharedBy] = useState<string[]>([]);

  useEffect(() => {
    if (open && editActivity) {
      setTitle(editActivity.title);
      setTime(editActivity.time || "");
      setDescription(editActivity.description || "");
      setCost(editActivity.cost != null ? editActivity.cost.toString() : "");
      setLink(editActivity.link || "");
      setDuration(editActivity.estimatedDuration || "");
      setPaidBy(editActivity.paidBy || "");
      setSharedBy(editActivity.sharedBy || participants.map((p) => p.id));
    } else if (open && !editActivity) {
      setTitle("");
      setTime("");
      setDescription("");
      setCost("");
      setLink("");
      setDuration("");
      setPaidBy("");
      setSharedBy(participants.map((p) => p.id));
    }
  }, [open, editActivity]);

  const costNum = cost ? parseFloat(cost) : 0;
  const perPerson = sharedBy.length > 0 && costNum > 0 ? costNum / sharedBy.length : 0;

  const toggleShared = (pid: string) => {
    setSharedBy((prev) => prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]);
  };

  const handleSubmit = () => {
    if (!title) return;
    onAdd({
      id: editActivity?.id || crypto.randomUUID(),
      title,
      time: time || undefined,
      description: description || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      paidBy: paidBy || undefined,
      sharedBy: sharedBy.length > 0 ? sharedBy : undefined,
      link: link || undefined,
      estimatedDuration: duration || undefined,
      status: editActivity?.status || "planeado",
      photos: editActivity?.photos || [],
      rating: editActivity?.rating,
      comments: editActivity?.comments,
    });
    setOpen(false);
  };

  const isControlled = controlledOpen !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <button className="w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 rounded-lg border border-dashed border-border hover:border-primary/30">
              <Plus size={14} /> Adicionar atividade
            </button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editActivity ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Local a visitar</Label>
            <Input placeholder="Ex: Torre de Belém" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Hora (opcional)</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Custo € (opcional)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
          </div>

          {/* Expense splitting - shown when cost > 0 and participants exist */}
          {costNum > 0 && participants.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Quem pagou</Label>
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaidBy(paidBy === p.id ? "" : p.id)}
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
                  <Label>Dividir entre</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSharedBy(participants.map((p) => p.id))} className="text-xs text-primary hover:underline">Todos</button>
                    <button type="button" onClick={() => setSharedBy([])} className="text-xs text-muted-foreground hover:underline">Limpar</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={sharedBy.includes(p.id)}
                        onCheckedChange={() => toggleShared(p.id)}
                      />
                      <span className="text-foreground">{p.name}</span>
                    </label>
                  ))}
                </div>
                {perPerson > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {perPerson.toFixed(2)}€ por pessoa
                  </p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Duração estimada (opcional)</Label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setDuration(duration === opt.label ? "" : opt.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    duration === opt.label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea placeholder="Notas..." value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <Label>Link (opcional)</Label>
            <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title}>
            {editActivity ? "Guardar" : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
