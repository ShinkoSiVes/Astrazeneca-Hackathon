# TASK-008 — Location selector agent

## Concise goal

Make screening-location entry fast and error-resistant with searchable offline region selection and locality choices that are limited to the chosen region.

## One-task protocol

1. Work only on `stage`; do not promote or edit `main`.
2. Deliver only the region/locality selector feature and its direct test coverage.
3. Keep the directory small, static, and clearly labelled as an offline demo fixture; do not claim it is a complete official barangay registry.
4. Changing a region must clear the previous locality unless it belongs to that selected region.
5. Finish with build, focused test, visual showcase, and stage documentation.

## Acceptance criteria

- All 18 Philippine regions can be found by typing a partial region name.
- Locality selection remains unavailable until a region is selected.
- The locality menu contains only choices from the selected region.
- No external lookup, sync, patient identity, or clinical inference is introduced.
