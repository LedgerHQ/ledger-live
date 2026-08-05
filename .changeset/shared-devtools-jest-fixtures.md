---
"@devtools/feature-flags": minor
"@devtools/transport-panel": minor
"@devtools/shell": minor
---

Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools-fixtures` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.
