import { Activity } from "@/types/trip";
import { ActivityCard } from "./ActivityCard";
import { sortActivities } from "@/lib/sortActivities";
import { Lock, GripVertical, AlertTriangle } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface Props {
  activities: Activity[];
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onReorder: (activities: Activity[]) => void;
}

function formatGap(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function getMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getGapMinutes(a: Activity, b: Activity): number | null {
  if (!a.time || !b.time) return null;
  const diff = getMinutes(b.time) - getMinutes(a.time);
  return diff > 30 ? diff : null;
}

export function ActivityTimeline({ activities, onUpdate, onDelete, onReorder }: Props) {
  const sorted = sortActivities(activities);

  // Conflict detection: find activities sharing the same time
  const conflictTimes = new Set<string>();
  const timeCounts: Record<string, number> = {};
  sorted.forEach((a) => {
    if (a.time) {
      timeCounts[a.time] = (timeCounts[a.time] || 0) + 1;
    }
  });
  Object.entries(timeCounts).forEach(([time, count]) => {
    if (count > 1) conflictTimes.add(time);
  });
  const hasConflict = (a: Activity) => !!a.time && conflictTimes.has(a.time);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = useCallback((idx: number, activity: Activity) => {
    if (activity.timeLocked) return;
    dragRef.current = idx;
    setDragIndex(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIndex(idx);
  }, []);

  const handleDrop = useCallback((dropIdx: number) => {
    const fromIdx = dragRef.current;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const item = sorted[fromIdx];
    if (item.timeLocked) return;

    // Calculate new time based on drop position
    const target = sorted[dropIdx];
    if (target?.time) {
      onUpdate({ ...item, time: target.time });
    }

    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, [sorted, onUpdate]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, []);

  // Touch drag support
  const touchItem = useRef<{ idx: number; el: HTMLElement | null }>({ idx: -1, el: null });

  const items: React.ReactNode[] = [];

  sorted.forEach((activity, idx) => {
    // Gap indicator
    if (idx > 0) {
      const gap = getGapMinutes(sorted[idx - 1], activity);
      if (gap !== null) {
        items.push(
          <div key={`gap-${idx}`} className="flex items-center pl-[11px] py-1">
            <div className="w-[2px] h-full bg-border" />
            <span className="text-[11px] text-muted-foreground/50 font-medium ml-3">
              {formatGap(gap)}
            </span>
          </div>
        );
      }
    }

    const isLocked = activity.timeLocked;
    const isDragging = dragIndex === idx;
    const isOver = overIndex === idx;
    const conflict = hasConflict(activity);

    items.push(
      <div
        key={activity.id}
        draggable={!isLocked}
        onDragStart={() => handleDragStart(idx, activity)}
        onDragOver={(e) => handleDragOver(e, idx)}
        onDrop={() => handleDrop(idx)}
        onDragEnd={handleDragEnd}
        className={`flex items-stretch transition-all duration-200 ${
          isDragging ? "opacity-40 scale-[0.97]" : ""
        } ${isOver && dragIndex !== null && dragIndex !== idx ? "translate-y-1" : ""}`}
      >
        {/* Timeline column */}
        <div className="flex flex-col items-center w-6 shrink-0 mr-3">
          <div className={`w-[2px] flex-1 ${idx === 0 ? "bg-transparent" : conflict ? "bg-warning/30" : "bg-border"}`} />
          <div
            className={`w-3 h-3 rounded-full shrink-0 border-2 transition-colors duration-200 ${
              conflict
                ? "bg-warning/20 border-warning"
                : isLocked
                ? "bg-primary border-primary"
                : activity.time
                ? "bg-card border-primary/40"
                : "bg-card border-muted-foreground/20"
            }`}
          />
          <div className={`w-[2px] flex-1 ${idx === sorted.length - 1 ? "bg-transparent" : "bg-border"}`} />
        </div>

        {/* Activity content */}
        <div className="flex-1 min-w-0 py-1">
          {/* Time + lock + conflict header */}
          <div className="flex items-center gap-1.5 mb-1">
            {!isLocked && !activity.time && (
              <span className="text-[11px] text-muted-foreground/40 italic">sem hora</span>
            )}
            {activity.time && (
              <span className={`text-xs font-semibold tabular-nums ${
                conflict ? "text-warning" : isLocked ? "text-primary" : "text-muted-foreground"
              }`}>
                {activity.time}
              </span>
            )}
            {isLocked && <Lock size={10} className="text-primary" />}
            {conflict && (
              <span className="inline-flex items-center gap-1 text-[10px] text-warning font-medium">
                <AlertTriangle size={10} /> Conflito
              </span>
            )}
            {!isLocked && activity.time && (
              <GripVertical size={12} className="text-muted-foreground/20 ml-auto cursor-grab active:cursor-grabbing" />
            )}
          </div>
          <ActivityCard
            activity={activity}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  });

  return <div className="flex flex-col">{items}</div>;
}
