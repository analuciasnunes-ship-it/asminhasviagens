import { Activity, Meal, Expense, Participant, DURATION_OPTIONS } from "@/types/trip";
import { ActivityCard } from "./ActivityCard";
import { MealCard } from "./MealCard";
import { ExpenseCard } from "./ExpenseCard";
import { sortActivities } from "@/lib/sortActivities";
import { Lock, GripVertical, AlertTriangle, UtensilsCrossed, ShoppingCart, Receipt } from "lucide-react";
import { useState, useRef, useCallback } from "react";

type TimelineItem =
  | { kind: "activity"; data: Activity }
  | { kind: "meal"; data: Meal }
  | { kind: "expense"; data: Expense };

interface Props {
  activities: Activity[];
  meals?: Meal[];
  expenses?: Expense[];
  participants?: Participant[];
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onReorder: (activities: Activity[]) => void;
  onUpdateMeal?: (meal: Meal) => void;
  onDeleteMeal?: (id: string) => void;
  onUpdateExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  highlightedActivityId?: string | null;
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

function getDurationMinutes(a: Activity): number {
  if (!a.estimatedDuration) return 0;
  const opt = DURATION_OPTIONS.find((o) => o.label === a.estimatedDuration);
  return opt?.minutes || 0;
}

function formatDurationShort(label: string): string {
  const map: Record<string, string> = {
    "Paragem rápida": "~10m",
    "15 min": "15m",
    "30 min": "30m",
    "1 h": "1h",
    "1 h 30": "1h30",
    "2 h": "2h",
    "3 h": "3h",
    "4 h": "4h",
    "5 h": "5h",
    "+ de 5 h": "5h+",
  };
  return map[label] || label;
}

function getItemTime(item: TimelineItem): string | undefined {
  if (item.kind === "activity") return (item.data as Activity).time;
  if (item.kind === "meal") return (item.data as Meal).time;
  return undefined;
}

function getGapMinutes(a: TimelineItem, b: TimelineItem): number | null {
  const timeA = getItemTime(a);
  const timeB = getItemTime(b);
  if (!timeA || !timeB) return null;
  const diff = getMinutes(timeB) - getMinutes(timeA);
  return diff > 30 ? diff : null;
}

export function ActivityTimeline({ activities, meals = [], expenses = [], participants = [], onUpdate, onDelete, onReorder, onUpdateMeal, onDeleteMeal, onUpdateExpense, onDeleteExpense, highlightedActivityId }: Props) {
  const sortedActivities = sortActivities(activities);

  // Build unified timeline
  const timelineItems: TimelineItem[] = [
    ...sortedActivities.map((a): TimelineItem => ({ kind: "activity", data: a })),
    ...meals.map((m): TimelineItem => ({ kind: "meal", data: m })),
    ...expenses.map((e): TimelineItem => ({ kind: "expense", data: e })),
  ].sort((a, b) => {
    const timeA = a.kind === "activity" ? (a.data as Activity).time : a.kind === "meal" ? (a.data as Meal).time : undefined;
    const timeB = b.kind === "activity" ? (b.data as Activity).time : b.kind === "meal" ? (b.data as Meal).time : undefined;
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return timeA.localeCompare(timeB);
  });

  const sorted = sortedActivities; // keep for drag logic

  // Conflict detection: same time OR duration overlap
  const conflictIds = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (!a.time) continue;
    const aStart = getMinutes(a.time);
    const aDur = getDurationMinutes(a);
    const aEnd = aStart + aDur;

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (!b.time) continue;
      const bStart = getMinutes(b.time);

      // Same time or duration overlap
      if (aStart === bStart || (aDur > 0 && aEnd > bStart)) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  const hasConflict = (a: Activity) => conflictIds.has(a.id);
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

    // Reorder: move item from fromIdx to dropIdx without changing time
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    // Assign orderIndex to all activities to preserve new order
    const updated = reordered.map((a, i) => ({ ...a, orderIndex: i }));
    onReorder(updated);

    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, [sorted, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, []);

  // Touch drag support
  const touchItem = useRef<{ idx: number; el: HTMLElement | null }>({ idx: -1, el: null });

  const items: React.ReactNode[] = [];

  timelineItems.forEach((item, idx) => {
    // Gap indicator
    if (idx > 0) {
      const gap = getGapMinutes(timelineItems[idx - 1], item);
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

    const isLast = idx === timelineItems.length - 1;
    const isFirst = idx === 0;

    if (item.kind === "meal") {
      const meal = item.data as Meal;
      items.push(
        <div key={meal.id} className="flex items-stretch">
          <div className="flex flex-col items-center w-6 shrink-0 mr-3">
            <div className={`w-[2px] flex-1 ${isFirst ? "bg-transparent" : "bg-border"}`} />
            <div className="w-3 h-3 rounded-full shrink-0 border-2 bg-warning/20 border-warning" />
            <div className={`w-[2px] flex-1 ${isLast ? "bg-transparent" : "bg-border"}`} />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {meal.time}
              </span>
              <UtensilsCrossed size={10} className="text-warning" />
            </div>
            <MealCard meal={meal} participants={participants} onDelete={onDeleteMeal || (() => {})} onUpdate={onUpdateMeal || (() => {})} />
          </div>
        </div>
      );
    } else if (item.kind === "expense") {
      const expense = item.data as Expense;
      const ExpIcon = expense.type === "supermarket" ? ShoppingCart : Receipt;
      items.push(
        <div key={expense.id} className="flex items-stretch">
          <div className="flex flex-col items-center w-6 shrink-0 mr-3">
            <div className={`w-[2px] flex-1 ${isFirst ? "bg-transparent" : "bg-border"}`} />
            <div className="w-3 h-3 rounded-full shrink-0 border-2 bg-accent border-muted-foreground/20" />
            <div className={`w-[2px] flex-1 ${isLast ? "bg-transparent" : "bg-border"}`} />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] text-muted-foreground/40 italic">despesa</span>
              <ExpIcon size={10} className="text-muted-foreground/40" />
            </div>
            <ExpenseCard expense={expense} participants={participants} onDelete={onDeleteExpense || (() => {})} onUpdate={onUpdateExpense} />
          </div>
        </div>
      );
    } else {
      const activity = item.data as Activity;
      const isLocked = activity.timeLocked;
      const actIdx = sorted.indexOf(activity);
      const isDragging = dragIndex === actIdx;
      const isOver = overIndex === actIdx;
      const conflict = hasConflict(activity);
      const isHighlighted = highlightedActivityId === activity.id;

      items.push(
        <div
          key={activity.id}
          id={`activity-${activity.id}`}
          draggable={!isLocked}
          onDragStart={() => handleDragStart(actIdx, activity)}
          onDragOver={(e) => handleDragOver(e, actIdx)}
          onDrop={() => handleDrop(actIdx)}
          onDragEnd={handleDragEnd}
          className={`flex items-stretch transition-all duration-200 rounded-lg ${
            isDragging ? "opacity-40 scale-[0.97]" : ""
          } ${isOver && dragIndex !== null && dragIndex !== actIdx ? "translate-y-1" : ""} ${
            isHighlighted ? "ring-2 ring-primary/50 bg-primary/5 animate-pulse" : ""
          }`}
        >
          <div className="flex flex-col items-center w-6 shrink-0 mr-3">
            <div className={`w-[2px] flex-1 ${isFirst ? "bg-transparent" : conflict ? "bg-warning/30" : "bg-border"}`} />
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
            <div className={`w-[2px] flex-1 ${isLast ? "bg-transparent" : "bg-border"}`} />
          </div>
          <div className="flex-1 min-w-0 py-1">
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
              {activity.estimatedDuration && (
                <span className="text-[11px] text-muted-foreground/40">
                  · {formatDurationShort(activity.estimatedDuration)}
                </span>
              )}
              {isLocked && <Lock size={10} className="text-primary" />}
              {conflict && (
                <span className="inline-flex items-center gap-1 text-[10px] text-warning font-medium">
                  <AlertTriangle size={10} /> Conflito
                </span>
              )}
              {!isLocked && (
                <GripVertical size={12} className="text-muted-foreground/20 ml-auto cursor-grab active:cursor-grabbing" />
              )}
            </div>
            <ActivityCard
              activity={activity}
              participants={participants}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </div>
        </div>
      );
    }
  });

  return <div className="flex flex-col">{items}</div>;
}
