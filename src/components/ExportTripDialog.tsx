import { Trip } from "@/types/trip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Download, FileText, MapPin, CalendarDays, Table2, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToGoogleMaps, exportToICS, exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  trip: Trip;
}

export function ExportTripDialog({ trip }: Props) {
  const [open, setOpen] = useState(false);

  const options = [
    {
      label: "Itinerário em PDF",
      desc: "Exportar atividades e horários",
      icon: <FileText size={18} />,
      action: async () => {
        await exportToPDF(trip);
        toast.success("PDF exportado!");
      },
    },
    {
      label: "Rota no Google Maps",
      desc: "Abrir atividades no mapa",
      icon: <MapPin size={18} />,
      action: () => {
        const url = exportToGoogleMaps(trip);
        if (!url) toast.error("Sem localizações para criar rota.");
        else toast.success("Rota aberta no Google Maps!");
      },
    },
    {
      label: "Calendário (.ics)",
      desc: "Exportar atividades com hora",
      icon: <CalendarDays size={18} />,
      action: () => {
        exportToICS(trip);
        toast.success("Calendário exportado!");
      },
    },
    {
      label: "Despesas em Excel (.xlsx)",
      desc: "Tabela completa com resumo financeiro",
      icon: <Table2 size={18} />,
      action: async () => {
        await exportToExcel(trip);
        toast.success("Excel exportado!");
      },
    },
    {
      label: "Dados em CSV",
      desc: "Exportar todas as despesas",
      icon: <FileSpreadsheet size={18} />,
      action: () => {
        exportToCSV(trip);
        toast.success("CSV exportado!");
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5">
          <Download size={14} /> Exportar
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Exportar viagem</SheetTitle>
        </SheetHeader>
        <div className="space-y-1 pb-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={async () => {
                await opt.action();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/80 active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
