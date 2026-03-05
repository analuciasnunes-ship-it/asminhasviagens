import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Activity } from "@/types/trip";

interface Props {
  onAdd: (activity: Activity) => void;
}

export function AddActivityDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = () => {
    if (!title) return;
    onAdd({
      id: crypto.randomUUID(),
      title,
      time: time || undefined,
      description: description || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      link: link || undefined,
      status: "planeado",
      photos: [],
    });
    setOpen(false);
    setTitle("");
    setTime("");
    setDescription("");
    setCost("");
    setLink("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 rounded-lg border border-dashed border-border hover:border-primary/30">
          <Plus size={14} /> Adicionar atividade
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
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
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea placeholder="Notas..." value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <Label>Link (opcional)</Label>
            <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title}>
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
