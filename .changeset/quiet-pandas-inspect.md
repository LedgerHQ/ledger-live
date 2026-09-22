---
"@devtools/cloud-sync": minor
"@devtools/env": minor
"@devtools/feature-flags": minor
"@devtools/pay-card": minor
"@devtools/protocols": minor
"@devtools/registry": minor
"@devtools/shell": minor
"@devtools/transport-panel": minor
"@devtools/trustchain": minor
---

Put every devtools package under knip and remove the dead code it found

Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
instead of a `./*` wildcard.
