---
"@domain/api-currencies": minor
"@features/platform-currencies": minor
"@devtools/currencies": minor
"@domain/entity-currency-fiat": patch
"@devtools/registry": patch
"@ledgerhq/web-tools": patch
---

Add `@domain/api-currencies` with a `cvs/` (Countervalues Service) RTK Query API for supported fiats, the `@features/platform-currencies` redux slice tracking them, and a `@devtools/currencies` tool wired into web-tools to exercise the flow. Enrich `@domain/entity-currency-fiat` with a by-ticker lookup. Not connected into the apps yet; this is the DDD evolution of `support.ts`.
