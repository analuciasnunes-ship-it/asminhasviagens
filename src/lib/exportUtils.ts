import { Trip } from "@/types/trip";
import { calculateBalances } from "@/lib/expenseUtils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// ─── ICS Calendar Export ───────────────────────────────────────────

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (c) => (c === "\n" ? "\\n" : `\\${c}`));
}

export function exportToICS(trip: Trip) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripPlanner//PT",
    `X-WR-CALNAME:${escapeICS(trip.destination)}`,
  ];

  for (const day of trip.days) {
    for (const act of day.activities) {
      if (!act.time) continue;
      const [h, m] = act.time.split(":").map(Number);
      const dtStart = new Date(day.date);
      dtStart.setHours(h, m, 0, 0);
      const dtEnd = new Date(dtStart.getTime() + 60 * 60 * 1000); // 1h default

      const fmtDt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      lines.push(
        "BEGIN:VEVENT",
        `DTSTART:${fmtDt(dtStart)}`,
        `DTEND:${fmtDt(dtEnd)}`,
        `SUMMARY:${escapeICS(act.title)}`,
        ...(act.location ? [`LOCATION:${escapeICS(act.location)}`] : []),
        ...(act.description ? [`DESCRIPTION:${escapeICS(act.description)}`] : []),
        `UID:${act.id}@tripplanner`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  downloadFile(lines.join("\r\n"), `${trip.destination}-calendario.ics`, "text/calendar");
}

// ─── Google Maps Export ────────────────────────────────────────────

export function exportToGoogleMaps(trip: Trip, dayId?: string) {
  const days = dayId ? trip.days.filter((d) => d.id === dayId) : trip.days;
  const locations: string[] = [];

  for (const day of days) {
    for (const act of day.activities) {
      if (act.lat && act.lng) {
        locations.push(`${act.lat},${act.lng}`);
      } else if (act.location) {
        locations.push(encodeURIComponent(act.location));
      }
    }
  }

  if (locations.length === 0) return null;

  const origin = locations[0];
  const destination = locations[locations.length - 1];
  const waypoints = locations.slice(1, -1).join("|");

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  url += "&travelmode=walking";

  window.open(url, "_blank");
  return url;
}

// ─── CSV Export ────────────────────────────────────────────────────

export function exportToCSV(trip: Trip) {
  const participants = trip.participants || [];
  const getName = (id: string) => participants.find((p) => p.id === id)?.name || "?";

  const rows: string[][] = [
    ["Data", "Nome", "Categoria", "Valor", "Pago por", "Partilhado entre", "Quota por pessoa"],
  ];

  for (const day of trip.days) {
    const date = format(new Date(day.date), "dd/MM/yyyy");

    for (const m of day.meals || []) {
      if ((m.totalBill ?? 0) > 0) {
        const bill = m.totalBill!;
        const share = m.sharedBy?.length ? (bill / m.sharedBy.length).toFixed(2) : bill.toFixed(2);
        rows.push([date, m.mealName + (m.restaurantName ? ` - ${m.restaurantName}` : ""), "Refeição", bill.toFixed(2), getName(m.paidBy || ""), (m.sharedBy || []).map(getName).join("; "), share]);
      }
    }
    for (const e of day.expenses || []) {
      const share = e.sharedBy?.length ? (e.amount / e.sharedBy.length).toFixed(2) : e.amount.toFixed(2);
      rows.push([date, e.description, e.type === "supermarket" ? "Supermercado" : "Outros", e.amount.toFixed(2), getName(e.paidBy), (e.sharedBy || []).map(getName).join("; "), share]);
    }
    for (const a of day.activities || []) {
      if (a.cost) {
        const share = a.sharedBy?.length ? (a.cost / a.sharedBy.length).toFixed(2) : a.cost.toFixed(2);
        rows.push([date, a.title, "Atividade", a.cost.toFixed(2), a.paidBy ? getName(a.paidBy) : "", (a.sharedBy || []).map(getName).join("; "), share]);
      }
    }
  }

  // Trip-level details
  const addDetail = (name: string, cat: string, price: number, paidBy?: string, sharedBy?: string[]) => {
    const share = sharedBy?.length ? (price / sharedBy.length).toFixed(2) : price.toFixed(2);
    rows.push(["—", name, cat, price.toFixed(2), paidBy ? getName(paidBy) : "", (sharedBy || []).map(getName).join("; "), share]);
  };

  for (const f of trip.flights || []) if (f.price) addDetail(f.flightNumber || `${f.origin}→${f.destination}`, "Voo", f.price, f.paidBy, f.sharedBy);
  for (const a of trip.accommodations || []) if (a.price) addDetail(a.placeName, "Alojamento", a.price, a.paidBy, a.sharedBy);
  for (const c of trip.rentalCars || []) if (c.price) addDetail(c.company, "Carro", c.price, c.paidBy, c.sharedBy);
  for (const o of trip.otherDetails || []) if (o.price) addDetail(o.description, "Outros", o.price, o.paidBy, o.sharedBy);

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile(csv, `${trip.destination}-despesas.csv`, "text/csv;charset=utf-8");
}

// ─── Excel Export ──────────────────────────────────────────────────

export async function exportToExcel(trip: Trip) {
  const XLSX = await import("xlsx");
  const participants = trip.participants || [];
  const getName = (id: string) => participants.find((p) => p.id === id)?.name || "?";

  // Sheet 1: Expenses
  const expenseRows: Record<string, string | number>[] = [];

  for (const day of trip.days) {
    const date = format(new Date(day.date), "dd/MM/yyyy");

    for (const m of day.meals || []) {
      expenseRows.push({
        Data: date, Nome: m.restaurantName, Categoria: "Refeição",
        Valor: m.totalBill, "Pago por": getName(m.paidBy),
        "Partilhado entre": (m.sharedBy || []).map(getName).join(", "),
        "Quota por pessoa": m.sharedBy?.length ? +(m.totalBill / m.sharedBy.length).toFixed(2) : m.totalBill,
      });
    }
    for (const e of day.expenses || []) {
      expenseRows.push({
        Data: date, Nome: e.description, Categoria: e.type === "supermarket" ? "Supermercado" : "Outros",
        Valor: e.amount, "Pago por": getName(e.paidBy),
        "Partilhado entre": (e.sharedBy || []).map(getName).join(", "),
        "Quota por pessoa": e.sharedBy?.length ? +(e.amount / e.sharedBy.length).toFixed(2) : e.amount,
      });
    }
    for (const a of day.activities || []) {
      if (a.cost) {
        expenseRows.push({
          Data: date, Nome: a.title, Categoria: "Atividade",
          Valor: a.cost, "Pago por": a.paidBy ? getName(a.paidBy) : "",
          "Partilhado entre": (a.sharedBy || []).map(getName).join(", "),
          "Quota por pessoa": a.sharedBy?.length ? +(a.cost / a.sharedBy.length).toFixed(2) : a.cost,
        });
      }
    }
  }

  const addDetailRow = (name: string, cat: string, price: number, paidBy?: string, sharedBy?: string[]) => {
    expenseRows.push({
      Data: "—", Nome: name, Categoria: cat, Valor: price,
      "Pago por": paidBy ? getName(paidBy) : "",
      "Partilhado entre": (sharedBy || []).map(getName).join(", "),
      "Quota por pessoa": sharedBy?.length ? +(price / sharedBy.length).toFixed(2) : price,
    });
  };

  for (const f of trip.flights || []) if (f.price) addDetailRow(f.flightNumber || `${f.origin}→${f.destination}`, "Voo", f.price, f.paidBy, f.sharedBy);
  for (const a of trip.accommodations || []) if (a.price) addDetailRow(a.placeName, "Alojamento", a.price, a.paidBy, a.sharedBy);
  for (const c of trip.rentalCars || []) if (c.price) addDetailRow(c.company, "Carro", c.price, c.paidBy, c.sharedBy);
  for (const o of trip.otherDetails || []) if (o.price) addDetailRow(o.description, "Outros", o.price, o.paidBy, o.sharedBy);

  // Sheet 2: Financial Summary
  const balances = calculateBalances(trip);
  const summaryRows = balances.map((b) => ({
    Participante: b.participantName,
    "Total pago": b.totalPaid,
    "Total devido": b.totalOwed,
    Saldo: b.net,
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(expenseRows);
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Despesas");
  XLSX.utils.book_append_sheet(wb, ws2, "Resumo Financeiro");
  XLSX.writeFile(wb, `${trip.destination}-despesas.xlsx`);
}

// ─── PDF Export ────────────────────────────────────────────────────

export async function exportToPDF(trip: Trip) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(trip.destination, 14, 20);
  doc.setFontSize(10);
  doc.text(
    `${format(new Date(trip.startDate), "d MMM yyyy", { locale: pt })} – ${format(new Date(trip.endDate), "d MMM yyyy", { locale: pt })}`,
    14,
    28
  );

  let y = 36;

  for (const day of trip.days) {
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text(
      `Dia ${day.dayNumber} – ${format(new Date(day.date), "EEEE, d MMMM", { locale: pt })}${day.title ? ` – ${day.title}` : ""}`,
      14,
      y
    );
    y += 4;
    doc.setFont(undefined as any, "normal");

    const rows = day.activities.map((a) => [
      a.time || "—",
      a.title,
      a.location || "—",
      a.description || "—",
    ]);

    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Hora", "Atividade", "Local", "Notas"]],
        body: rows,
        margin: { left: 14 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      y += 6;
    }

    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save(`${trip.destination}-itinerario.pdf`);
}

// ─── Helpers ───────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
