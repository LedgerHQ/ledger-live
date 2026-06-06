---
"@ledgerhq/live-countervalues-react": patch
"@ledgerhq/live-countervalues": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/hw-app-vet": patch
---

Drop the unused `@ledgerhq/cryptoassets` dependency. coin-kaspa and hw-app-vet never imported it. live-countervalues and live-countervalues-react only used it in tests, which now rely on local currency fixtures, removing the dependency from the runtime graph.
