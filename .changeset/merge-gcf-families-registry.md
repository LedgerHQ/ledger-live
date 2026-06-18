---
"@ledgerhq/live-common": patch
---

Reunite all coin-family code under `families/<family>/` and route every per-family hook through the coin-module loaders registry. Moves the generic-coin-framework family adapters (signer, bridge api, accountRawAssign) and the per-coin local API adapters (`api/local/*` → `families/<family>/coinModuleApi.ts`) into the top-level families, and adds `loadBridgeApi` / `loadAccountRawAssign` / `loadLocalApi` to the registry (joining `loadSigner`). Removes the per-family `switch (network)` dispatch in the generic-coin-framework. Internal refactor, no behavior change.
