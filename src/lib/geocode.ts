const geocodeCache: Record<string, [number, number] | null> = {};

export async function geocodeLocation(location: string): Promise<[number, number] | null> {
  if (geocodeCache[location] !== undefined) return geocodeCache[location];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      { headers: { "User-Agent": "TripPlannerApp/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[location] = coords;
      return coords;
    }
    geocodeCache[location] = null;
    return null;
  } catch {
    geocodeCache[location] = null;
    return null;
  }
}
