export type RegionLocationDirectory = {
  region: string;
  localities: string[];
};

/**
 * Small offline demo directory for the hackathon prototype. It deliberately
 * lists municipality/city-level choices rather than claiming to be a complete
 * or current national barangay registry.
 */
export const regionLocationDirectory: RegionLocationDirectory[] = [
  { region: "Region I - Ilocos Region", localities: ["Laoag City", "Vigan City", "San Fernando, La Union"] },
  { region: "Region II - Cagayan Valley", localities: ["Tuguegarao City", "Ilagan City", "Bayombong"] },
  { region: "Region III - Central Luzon", localities: ["Angeles City", "Malolos City", "San Fernando, Pampanga"] },
  { region: "Region IV-A - CALABARZON", localities: ["Antipolo City", "Calamba City", "Batangas City"] },
  { region: "Region V - Bicol Region", localities: ["Legazpi City", "Naga City", "Daet"] },
  { region: "Region VI - Western Visayas", localities: ["Iloilo City", "Bacolod City", "Kalibo"] },
  { region: "Negros Island Region (NIR)", localities: ["Dumaguete City", "Bais City", "Siquijor"] },
  { region: "Region VII - Central Visayas", localities: ["Cebu City", "Lapu-Lapu City", "Tagbilaran City"] },
  { region: "Region VIII - Eastern Visayas", localities: ["Tacloban City", "Ormoc City", "Catbalogan City"] },
  { region: "Region IX - Zamboanga Peninsula", localities: ["Zamboanga City", "Pagadian City", "Dipolog City"] },
  { region: "Region X - Northern Mindanao", localities: ["Cagayan de Oro", "Iligan City", "Malaybalay City"] },
  { region: "Region XI - Davao Region", localities: ["Davao City", "Tagum City", "Digos City"] },
  { region: "Region XII - SOCCSKSARGEN", localities: ["General Santos City", "Koronadal City", "Kidapawan City"] },
  { region: "National Capital Region (NCR)", localities: ["Manila", "Quezon City", "Makati City"] },
  { region: "Cordillera Administrative Region (CAR)", localities: ["Baguio City", "La Trinidad", "Tabuk City"] },
  { region: "Region XIII - Caraga", localities: ["Butuan City", "Surigao City", "Tandag City"] },
  { region: "MIMAROPA Region", localities: ["Puerto Princesa City", "Calapan City", "Romblon"] },
  { region: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)", localities: ["Cotabato City", "Marawi City", "Jolo"] },
];

export const localitiesForRegion = (region: string) => regionLocationDirectory.find((entry) => entry.region === region)?.localities ?? [];
