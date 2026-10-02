---
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(feature-flags): show the Firebase project the build actually targets

The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
remote flag, a value set by hand in each Firebase project, so a staging build reported
`ledger-live-production`. It now reads the project id from the Firebase config bundled in the
build.
