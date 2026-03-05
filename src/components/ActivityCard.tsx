import { Activity } from "@/types/trip";
import { Check, Clock, ExternalLink, Lock, LockOpen, Pencil, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  activity: Activity;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function ActivityCard({ activity, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Activity>>({});
  const isVisited = activity.status === "visitado";

  const startEditing = () => {
    setEditData({
      title: activity.title,
      time: activity.time || "",
      description: activity.description || "",
      cost: activity.cost,
      status: activity.status,
      timeLocked: activity.timeLocked || false,
      link: activity.link || "",
    });
    setEditing(true);
  };

  const saveEdits = () => {
    onUpdate({
      ...activity,
      ...editData,
      cost: editData.cost != null && editData.cost !== undefined ? Number(editData.cost) : undefined,
    });
    setEditing(false);
  };

  const toggleStatus = () => {
    onUpdate({
      ...activity,
      status: isVisited ? "planeado" : "visitado",
    });
  };

  const setRating = (r: number) => onUpdate({ ...activity, rating: r });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({
        ...activity,
        photos: [...(activity.photos || []), reader.result as string],
      });
    };
    reader.readAsDataURL(file);
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Editar atividade</span>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <Input
          placeholder="Título *"
          value={editData.title || ""}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
        />
        <div className="flex gap-2">
          <Input
            type="time"
            value={editData.time || ""}
            onChange={(e) => setEditData({ ...editData, time: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Custo €"
            value={editData.cost ?? ""}
            onChange={(e) => setEditData({ ...editData, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="flex-1"
          />
        </div>
        <Textarea
          placeholder="Descrição (opcional)"
          value={editData.description || ""}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          className="min-h-[60px] resize-none"
        />
        <Input
          placeholder="Link (opcional)"
          value={editData.link || ""}
          onChange={(e) => setEditData({ ...editData, link: e.target.value })}
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Estado:
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value as Activity["status"] })}
              className="bg-secondary text-foreground rounded-md px-2 py-1 text-sm border-none outline-none"
            >
              <option value="planeado">Planeado</option>
              <option value="visitado">Visitado</option>
            </select>
          </label>
          <button
            onClick={() => setEditData({ ...editData, timeLocked: !editData.timeLocked })}
            className={`flex items-center gap-1 text-sm transition-colors ${editData.timeLocked ? "text-primary" : "text-muted-foreground"}`}
          >
            {editData.timeLocked ? <Lock size={14} /> : <LockOpen size={14} />}
            {editData.timeLocked ? "Obrigatório" : "Indicativo"}
          </button>
        </div>
        <Button onClick={saveEdits} disabled={!editData.title?.trim()} className="w-full" size="sm">
          Guardar alterações
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border transition-all animate-fade-in ${
        isVisited
          ? "bg-success/5 border-success/20"
          : "bg-card border-border"
      }`}
    >
      <div className="p-3 flex items-start gap-3">
        <button
          onClick={toggleStatus}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isVisited
              ? "bg-success border-success"
              : "border-muted-foreground/30"
          }`}
        >
          {isVisited && <Check size={12} className="text-success-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-medium text-sm ${
                isVisited ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {activity.title}
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              {activity.cost != null && activity.cost > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {activity.cost.toFixed(2)}€
                </span>
              )}
              <button onClick={startEditing} className="text-muted-foreground/40 hover:text-primary transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(activity.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {activity.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={11} /> {activity.time}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ ...activity, timeLocked: !activity.timeLocked });
                }}
                className={`ml-1 transition-colors ${
                  activity.timeLocked
                    ? "text-primary"
                    : "text-muted-foreground/30 hover:text-muted-foreground"
                }`}
                title={activity.timeLocked ? "Hora fixa" : "Hora flexível"}
              >
                {activity.timeLocked ? <Lock size={11} /> : <LockOpen size={11} />}
              </button>
            </span>
          )}
          {activity.description && !isVisited && (
            <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
          )}
          {activity.link && (
            <a
              href={activity.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
            >
              <ExternalLink size={11} /> Ver link
            </a>
          )}
        </div>
      </div>

      {isVisited && (
        <div className="px-3 pb-3 space-y-3 border-t border-success/10 pt-3 mx-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  size={18}
                  className={`transition-colors ${
                    (activity.rating || 0) >= s
                      ? "text-warning fill-warning"
                      : "text-muted-foreground/20"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Notas ou comentários..."
            value={activity.comments || ""}
            onChange={(e) => onUpdate({ ...activity, comments: e.target.value })}
            className="text-sm min-h-[60px] resize-none"
          />
          <div>
            <label className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              + Adicionar foto
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {activity.photos && activity.photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {activity.photos.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
