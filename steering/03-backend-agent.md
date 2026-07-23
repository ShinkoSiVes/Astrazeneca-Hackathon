# Goal

Provide only the local contracts needed for the currently selected web-app feature.

## Current Task: One Feature Only

- Feature: assigned by the stage coordinator.
- User outcome: receive a predictable local result without exposing data externally.
- Allowed files: local API contract, fixture handler, direct tests, and provenance notes.
- Acceptance criteria: typed response, explicit failure state, no remote dependency, and frontend contract coverage.
- Out of scope: databases, cloud services, authentication providers, and model retraining.
- Stop when: the named contract supports its feature and is documented.

Return changed files, verification evidence, limitations, and the next recommended single feature.
