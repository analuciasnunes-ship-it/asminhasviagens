import { Activity } from "@/types/trip";
import { Check, Clock, ExternalLink, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  activity: Activity;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function ActivityCard({ activity, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isVisited = activity.status === "visitado";

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
              <button onClick={() => onDelete(activity.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {activity.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={11} /> {activity.time}
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
