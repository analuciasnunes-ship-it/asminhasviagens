import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: { name: string; displayName: string; lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ value, onChange, onSelect, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { "User-Agent": "TripPlannerApp/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const shortName = result.name || value;
    onChange(shortName);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect?.({
      name: shortName,
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Truncate display_name for cleaner UI
  const formatAddress = (display: string) => {
    const parts = display.split(",").map(p => p.trim());
    return parts.slice(0, 3).join(", ");
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className={className}
      />
      {showSuggestions && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">A procurar...</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-start gap-2"
            >
              <MapPin size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{s.name || formatAddress(s.display_name)}</div>
                <div className="text-xs text-muted-foreground truncate">{formatAddress(s.display_name)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
