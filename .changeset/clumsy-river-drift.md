---
"@devtools/bindings": patch
"@devtools/feature-flags": patch
"@devtools/pay-card": patch
"@devtools/protocols": patch
"@devtools/registry": patch
"@devtools/relay": patch
"@devtools/shell": patch
"@devtools/transport-panel": patch
"@devtools/transport": patch
"@devtools/wire": patch
---

All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.
