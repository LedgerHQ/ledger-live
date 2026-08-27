---
"@devtools/feature-flags": patch
"live-mobile": patch
---

Declares `expo-document-picker` as an optional peer dependency (and devDependency) in `@devtools/feature-flags`, removing it from regular dependencies. Adds it as a direct dependency in `ledger-live-mobile` so autolinking resolves correctly on the native side.
