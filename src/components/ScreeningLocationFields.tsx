import { useEffect, useMemo, useState } from "react";
import { SearchableSelect } from "./SearchableSelect";
import { localityOptionLabel, regionNames, type OfflinePSGCDirectory } from "../philippines-locations";

type ScreeningLocationFieldsProps = {
  region: string;
  municipality: string;
  barangay: string;
  invalidRegion?: boolean;
  invalidMunicipality?: boolean;
  invalidBarangay?: boolean;
  onRegionChange: (region: string) => void;
  onMunicipalityChange: (municipality: string) => void;
  onBarangayChange: (barangay: string) => void;
};

export function ScreeningLocationFields({ region, municipality, barangay, invalidRegion = false, invalidMunicipality = false, invalidBarangay = false, onRegionChange, onMunicipalityChange, onBarangayChange }: ScreeningLocationFieldsProps) {
  const [directory, setDirectory] = useState<OfflinePSGCDirectory | null>(null);
  const [directoryError, setDirectoryError] = useState(false);

  useEffect(() => {
    let active = true;
    void import("../data/psgc-2026-01-13.json")
      .then((module) => {
        if (active) setDirectory(module.default as OfflinePSGCDirectory);
      })
      .catch(() => {
        if (active) setDirectoryError(true);
      });
    return () => { active = false; };
  }, []);

  const selectedRegion = useMemo(() => directory?.regions.find((entry) => entry.name === region), [directory, region]);
  const localities = selectedRegion?.localities ?? [];
  const localityOptions = localities.map(localityOptionLabel);
  const selectedLocality = localities.find((entry) => localityOptionLabel(entry) === municipality);

  return (
    <div className="screening-location-fields wide-field">
      <SearchableSelect
        label="Region"
        value={region}
        options={[...regionNames]}
        placeholder="Search the 18 regions"
        emptyMessage="No matching region"
        inputName="province"
        invalid={invalidRegion}
        onChange={onRegionChange}
      />
      <SearchableSelect
        label="City / municipality"
        value={municipality}
        options={localityOptions}
        placeholder={!region ? "Select a region first" : !directory ? "Loading offline directory…" : "Search a city or municipality"}
        emptyMessage={directoryError ? "Offline directory could not load" : "No matching city or municipality in this region"}
        disabled={!region || !directory}
        inputName="municipality"
        invalid={invalidMunicipality}
        onChange={onMunicipalityChange}
      />
      <SearchableSelect
        label="Barangay"
        value={barangay}
        options={selectedLocality?.barangays ?? []}
        placeholder={!municipality ? "Select a city or municipality first" : "Search barangays in this locality"}
        emptyMessage={selectedLocality ? "No matching barangay in this locality" : "Select a city or municipality first"}
        disabled={!selectedLocality}
        inputName="barangay"
        invalid={invalidBarangay}
        onChange={onBarangayChange}
      />
      <p className="field-note wide-field">Offline PSGC directory: all 18 regions, then the matching city/municipality, then the barangays recorded for that locality. The directory is bundled with this stage build; no network request is made while screening.</p>
    </div>
  );
}
