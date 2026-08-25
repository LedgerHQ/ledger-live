---
"@devtools/bindings": minor
"@devtools/feature-flags": minor
"@devtools/pay-card": minor
"@devtools/protocols": minor
"@devtools/registry": minor
"@devtools/relay": minor
"@devtools/shell": minor
"@devtools/transport-panel": minor
"@devtools/transport": minor
"@devtools/wire": minor
---

All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.
