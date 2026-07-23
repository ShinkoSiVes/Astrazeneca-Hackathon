# TASK-006 review pack

## Goal

Provide a useful, visually clear 18-region population-dashboard interaction without representing synthetic UI fixtures as live clinical or geographic data.

## User-visible feature

- The front-page **Heatmap status** control now opens a synthetic population dashboard.
- The dashboard has 18 numbered regional fixture cells, each selectable to reveal an illustrative follow-up-signal detail panel.
- The panel shows synthetic signal level, generated demo-record count, and illustrative fixture coverage.
- The dashboard reports the count of locally created TASK-005 population fixtures only as an unmapped total.
- Every screen states that the dashboard is synthetic, non-live, and not a clinical-risk estimate; sharing is disabled.

## Demo path

1. From the front page, choose **Heatmap status**.
2. Confirm the four synthetic-data safeguards and the 18 regional fixture cells.
3. Select any region, for example **Region 12**, and inspect the detail panel.
4. Confirm that the detail says it is illustrative and does not identify a location with elevated clinical risk.

## Changed files

- `src/App.tsx` — synthetic regional fixtures, selectable dashboard, local-population count display, and dashboard entry point.
- `src/styles.css` — responsive 18-cell regional grid, signal treatments, and selected-region panel.
- `src/App.test.tsx` — direct coverage for all 18 selectable cells, region selection, and no-live-data safeguards.
- `docs/stage/model-provenance.md` — fixture provenance and no-inference limitation.
- `docs/stage/reviews/assets/task-006-synthetic-dashboard.png` — visual evidence.

## Verification

- `npm.cmd test -- --run` passed: 13 tests.
- `npm.cmd run build` passed.
- Visual review passed: the 18-cell grid, selected region, and synthetic-data disclaimer are legible at the stage preview.

## TASK-006 revision - Interactive Philippines map surface

### User-visible effect

- The 18 regional cards are now represented by a native SVG, 3D-styled Philippines selection model.
- Each numbered fixture can be clicked or selected with Enter/Space. Selection raises the area visually and updates the region detail panel.
- A signal legend and explicit non-GIS disclaimer remain beside the map.

### Visual evidence

- [Interactive Philippines map](assets/task-006-interactive-philippines-map.png)

### Verification

- `npm.cmd test -- --run` passed: 14 tests, including direct map keyboard-selection coverage.
- `npm.cmd run build` passed.
- Visual review passed: selecting Region 12 on the map updates the selected-region panel while the synthetic-data safeguards remain visible.

### Revision limitations

- The Philippines shape and numbered areas are a stylized selection surface, not real administrative or GIS boundaries.
- Map height, signal color, and 3D depth are visual-only; they do not encode clinical severity, risk, or location data.

## Known limitations

- Regions are numbered synthetic fixtures, not named or attributed to real-world Philippine administrative areas.
- Color intensity does not indicate clinical risk, cancer incidence, follow-up need, or public-health status.
- No live aggregation, geographic mapping, public/environmental/hospital data, or external sharing exists.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: `8e01ac8` — `feat(task-006): add synthetic regional dashboard`.
- Proposed TASK-006 revision: `af45d66` — `feat(task-006): add interactive map surface`.
- Proposed TASK-006 revision: `fcf01d4` — `feat(task-006): connect map to population fixtures`.
- Approval command: `Approve TASK-006 for main`.
