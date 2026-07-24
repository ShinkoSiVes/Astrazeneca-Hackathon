# TASK-008B — Connected tobacco-use amount agent

## Concise goal

Make tobacco-use frequency and estimated packs a single clear, connected input in local screening step 2.

## One-task protocol

1. Work only on `stage`; do not promote or edit `main`.
2. Deliver only the connected tobacco-use control and its direct test coverage.
3. Place frequency first, then estimated packs beneath it; do not leave them as unrelated grid fields.
4. Keep the value understandable in plain language and prevent contradictory no-use data.
5. Finish with build, focused test, visual showcase, and stage documentation.

## Acceptance criteria

- Frequency appears above estimated packs in one visible group.
- Estimated packs is disabled until a frequency is selected.
- The selected values produce a readable combined summary.
- `Not a smoker` prevents an estimated pack value from being entered.
