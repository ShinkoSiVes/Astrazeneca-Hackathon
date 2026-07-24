import { SearchableSelect } from "./SearchableSelect";
import { localitiesForRegion, regionLocationDirectory } from "../philippines-locations";

type ScreeningLocationFieldsProps = {
  region: string;
  locality: string;
  onRegionChange: (region: string) => void;
  onLocalityChange: (locality: string) => void;
};

export function ScreeningLocationFields({ region, locality, onRegionChange, onLocalityChange }: ScreeningLocationFieldsProps) {
  return (
    <div className="screening-location-fields wide-field">
      <SearchableSelect
        label="Region"
        value={region}
        options={regionLocationDirectory.map((entry) => entry.region)}
        placeholder="Search the 18 regions"
        emptyMessage="No matching region"
        onChange={onRegionChange}
      />
      <SearchableSelect
        label="Barangay / municipality"
        value={locality}
        options={localitiesForRegion(region)}
        placeholder={region ? "Search locations in this region" : "Select a region first"}
        emptyMessage={region ? "No matching location in this region" : "Select a region first"}
        disabled={!region}
        onChange={onLocalityChange}
      />
      <p className="field-note wide-field">Offline demo directory: 18 regions with representative municipality/city options. Select a region first; locality choices are filtered to that region only.</p>
    </div>
  );
}
