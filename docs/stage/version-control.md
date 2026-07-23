# Version-control record

## Remote

- GitHub repository: `https://github.com/ShinkoSiVes/Astrazeneca-Hackathon.git`
- Remote name: `origin`

## Long-lived branches

| Branch | Purpose | Promotion rule |
| --- | --- | --- |
| `stage` | All implementation, assets, task review packs, decisions, and QA evidence. | Pushes are allowed after a committed stage task or revision. |
| `main` | Approved demo only. | Only the owner may approve promotion from a reviewed stage task. Never force-push or directly implement features here. |

## Commit and documentation rule

1. Make each visible feature or owner-requested revision on `stage`.
2. Commit it with a task-scoped message before sharing it remotely.
3. Record the feature, decision, verification, and approval state in `docs/stage/`.
4. Push `stage`; do not rebase, amend published commits, or force-push.
5. Push or update `main` only for its approved history.

## Initial published history

- `ece645b` — protected `main` baseline; no unapproved feature.
- `95cf7dc` — TASK-001 consent and local demo login.
- `2c3e4f4` — TASK-001 accessible workflow motion revision.
- `335ed65` — TASK-001 Hinga temporary identity revision.

The TASK-001 review pack remains pending owner approval. These stage commits must not be promoted to `main` until the owner explicitly approves them.
