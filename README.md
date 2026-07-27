# Project iDEA

An offline-first hackathon prototype for clinician-led lung-cancer community screening and de-identified population insights.

## Branch policy

- `stage` contains all work in review, steering documents, and review evidence.
- `main` contains only user-approved promotions.
- Do not commit to `main` unless the user has explicitly approved the relevant `TASK-###` review pack.

## Run the stage preview

```powershell
pnpm install
pnpm dev
```

## Verify

```powershell
pnpm run build
pnpm test
```

See `docs/stage/reviews/` for feature review packs and `steering/` for the one-task agent protocol.

## Open clinical-data decision

The expanded screening-profile variables are currently captured, validated, and stored locally only. The team still needs to decide which new symptoms, medical-history items, exposure details, clinical-assessment values, and physical-examination findings may be used by the prototype risk calculation or retained in de-identified population aggregation. Do not connect these fields to either downstream path until clinical and privacy review is complete.
