# Offline location directory provenance

## Goal

Provide a complete searchable field-location directory without a runtime internet dependency.

## Bundled asset

- File: `src/data/psgc-2026-01-13.json`
- Hierarchy: 18 regions -> 1,655 cities/municipalities -> 42,010 barangay entries
- Size: approximately 697 KB before build compression
- Runtime behavior: dynamically loaded from the app bundle when the screening location controls mount; no clinician-entered information is sent to a location service.

## Source and processing

- Research authorization: owner approved online research on 24 July 2026.
- Authority checked: Philippine Statistics Authority (PSA), [PSGC barangay publication page](https://psa.gov.ph/classification/psgc/barangays), which publishes the quarterly masterlist and states the 30 June 2026 release.
- Official cross-check: PSA's [Negros Island Region summary](https://psa.gov.ph/classification/psgc/provinces/1800000000) confirms the current 18-region model.
- Packaged hierarchy: `barangay` Python package version `2026.1.13.1`, whose metadata describes a PSGC 2026 hierarchy, normalized locally into the app's region -> city/municipality -> barangay structure.
- Correction applied: removed Barangay San Rafael from City of Calaca, Batangas, to reflect PSA's first-quarter 2026 notice that it was merged into Barangay Dacanlao. This changes the package's 42,011 entries to 42,010.

## Limitations and refresh rule

- This is an offline reference snapshot, not a live official PSA feed and not a substitute for a patient address verification workflow.
- The PSA released second-quarter 2026 naming corrections after the packaged source snapshot. Do not silently mutate this directory; any refresh must be proposed, reviewed on `stage`, and recorded here.
- The directory contains geographic labels only. It includes no patient, clinician, imaging, or risk data.
