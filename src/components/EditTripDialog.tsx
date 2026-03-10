import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Upload, X, Image } from "lucide-react";
import { Trip, DayPlan } from "@/types/trip";
import { differenceInDays, addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function EditTripDialog({ trip, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [coverImage, setCoverImage] = useState(trip.coverImage || "");
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDestination(trip.destination);
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setCoverImage(trip.coverImage || "");
      setCoverUrl("");
    }
    setOpen(isOpen);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor seleciona uma imagem.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${trip.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("trip-covers").upload(path, file);
    if (error) {
      toast.error("Erro ao carregar imagem.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("trip-covers").getPublicUrl(path);
    setCoverImage(urlData.publicUrl);
    setUploading(false);
    toast.success("Imagem carregada!");
  };

  const handleApplyUrl = () => {
    if (coverUrl.trim()) {
      setCoverImage(coverUrl.trim());
      setCoverUrl("");
    }
  };

  const handleSubmit = () => {
    if (!destination || !startDate || !endDate) return;

    const oldStart = new Date(trip.startDate);
    const oldEnd = new Date(trip.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    let days = trip.days;

    // Regenerate days if dates changed
    if (startDate !== trip.startDate || endDate !== trip.endDate) {
      const totalDays = differenceInDays(newEnd, newStart) + 1;
      days = Array.from({ length: totalDays }, (_, i) => {
        const date = format(addDays(newStart, i), "yyyy-MM-dd");
        // Try to reuse existing day by date
        const existing = trip.days.find((d) => d.date === date);
        if (existing) {
          return { ...existing, dayNumber: i + 1 };
        }
        return {
          id: crypto.randomUUID(),
          date,
          dayNumber: i + 1,
          activities: [],
        };
      });
    }

    onUpdate({
      ...trip,
      destination,
      startDate,
      endDate,
      coverImage: coverImage || undefined,
      days,
    });

    setOpen(false);
    toast.success("Viagem atualizada!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="text-white/80 hover:text-white transition-colors backdrop-blur-sm bg-black/20 rounded-full p-2">
          <Pencil size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Viagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-destination">Destino</Label>
            <Input
              id="edit-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Início</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">Fim</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Cover image section */}
          <div className="space-y-2">
            <Label>Imagem de capa</Label>

            {coverImage && (
              <div className="relative rounded-lg overflow-hidden h-32">
                <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={14} />
                {uploading ? "A carregar..." : "Ficheiro"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex-1 flex gap-1">
                <Input
                  placeholder="URL da imagem"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="text-xs h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyUrl}
                  disabled={!coverUrl.trim()}
                >
                  <Image size={14} />
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!destination || !startDate || !endDate}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
