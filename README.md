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
