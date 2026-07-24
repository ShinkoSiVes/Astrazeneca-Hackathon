export type PSGCLocality = {
  id: string;
  name: string;
  province: string;
  barangays: string[];
};

export type OfflinePSGCDirectory = {
  version: string;
  source: string;
  regions: Array<{
    name: string;
    localities: PSGCLocality[];
  }>;
};

// Kept separate from the larger directory so the first location control is
// available immediately; the full offline data is loaded only in screening.
export const regionNames = [
  "Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)",
  "Cordillera Administrative Region (CAR)",
  "MIMAROPA Region",
  "National Capital Region (NCR)",
  "Negros Island Region (NIR)",
  "Region I (Ilocos Region)",
  "Region II (Cagayan Valley)",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)",
  "Region IX (Zamboanga Peninsula)",
  "Region V (Bicol Region)",
  "Region VI (Western Visayas)",
  "Region VII (Central Visayas)",
  "Region VIII (Eastern Visayas)",
  "Region X (Northern Mindanao)",
  "Region XI (Davao Region)",
  "Region XII (SOCCSKSARGEN)",
  "Region XIII (Caraga)",
] as const;

export const localityOptionLabel = (locality: PSGCLocality) => locality.province ? `${locality.name} — ${locality.province}` : locality.name;
