import { Activity, Participant } from "@/types/trip";
import { Camera, Check, Clock, ExternalLink, Lock, LockOpen, MapPin, MessageSquarePlus, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { AddActivityDialog } from "./AddActivityDialog";

interface Props {
  activity: Activity;
  participants?: Participant[];
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function ActivityCard({ activity, participants = [], onUpdate, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
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

  const payer = activity.paidBy ? participants.find((p) => p.id === activity.paidBy) : null;
  const sharers = activity.sharedBy ? participants.filter((p) => activity.sharedBy!.includes(p.id)) : [];
  const perPerson = activity.cost && sharers.length > 0 ? activity.cost / sharers.length : 0;

  return (
    <>
      <div
        className={`rounded-xl border transition-all duration-200 animate-fade-in shadow-sm ${
          isVisited
            ? "bg-success/5 border-success/20"
            : activity.timeLocked
            ? "bg-secondary/80 border-primary/15 shadow-md"
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
                className="font-medium text-sm flex items-center gap-1.5 text-foreground"
              >
                <MapPin size={13} className="text-primary/60 shrink-0" />
                {activity.title}
              </h4>
              <div className="flex items-center gap-2 shrink-0">
                {activity.cost != null && activity.cost > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {activity.cost.toFixed(2)}€
                  </span>
                )}
                <button onClick={() => setEditOpen(true)} className="text-muted-foreground/40 hover:text-primary transition-colors">
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
            {activity.location && (
              <div className="flex items-center gap-3 mt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <MapPin size={11} /> Abrir no Maps
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activity.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Navigation size={11} /> Navegar
                </a>
              </div>
            )}
            {/* Expense split info */}
            {payer && activity.cost != null && activity.cost > 0 && (
              <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
                <p>Pago por <span className="font-medium text-foreground">{payer.name}</span></p>
                {sharers.length > 0 && (
                  <p>
                    Dividido: {sharers.map((s) => s.name).join(", ")}
                    {perPerson > 0 && <span className="ml-1 font-medium">· {perPerson.toFixed(2)}€/pessoa</span>}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {isVisited && (
          <div className="px-3 pb-3 border-t border-success/10 pt-3 mx-3 space-y-3">
            {/* Rating */}
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

            {/* Divider */}
            <div className="border-t border-border/40" />

            {/* Action buttons row */}
            <div className="flex items-center gap-4">
              {!(activity.comments || showNote) && (
                <button
                  onClick={() => setShowNote(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <MessageSquarePlus size={13} />
                  Adicionar nota
                </button>
              )}
              {!(activity.photos && activity.photos.length > 0) && !showPhoto && (
                <button
                  onClick={() => setShowPhoto(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <Camera size={13} />
                  Adicionar foto
                </button>
              )}
              {showPhoto && !(activity.photos && activity.photos.length > 0) && (
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-1">
                  <Camera size={13} />
                  Escolher foto
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>

            {/* Note textarea (below actions) */}
            {(activity.comments || showNote) && (
              <Textarea
                placeholder="Notas ou comentários..."
                value={activity.comments || ""}
                onChange={(e) => onUpdate({ ...activity, comments: e.target.value })}
                className="text-sm min-h-[60px] resize-none"
                autoFocus={showNote && !activity.comments}
              />
            )}

            {/* Photos (below actions) */}
            {activity.photos && activity.photos.length > 0 && (
              <div>
                <div className="flex gap-2 overflow-x-auto">
                  {activity.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
                <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Camera size={13} />
                  Adicionar foto
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <AddActivityDialog
        onAdd={onUpdate}
        participants={participants}
        editActivity={activity}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
