# TASK-008 revision — Offline PSGC location selector agent

## Concise goal

Make screening-location entry fast and error-resistant with a bundled searchable PSGC hierarchy: Region, then City / municipality, then Barangay.

## One-task protocol

1. Work only on `stage`; do not promote or edit `main`.
2. Deliver only the offline hierarchy selector revision and its direct test coverage.
3. Bundle the approved PSGC-based snapshot; do not make a runtime network lookup or claim it receives automatic updates.
4. Changing a region must clear the selected city/municipality and barangay; changing the city/municipality must clear the barangay.
5. Finish with build, focused test, visual showcase, and stage documentation.

## Acceptance criteria

- All 18 Philippine regions can be found by typing a partial region name.
- City/municipality selection remains unavailable until a region is selected.
- Barangay selection remains unavailable until a city/municipality is selected.
- Each menu contains only options from its selected parent.
- The source count, source version, and offline limitation are documented in the stage provenance record.
