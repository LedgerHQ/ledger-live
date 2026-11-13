---
"@ledgerhq/coin-canton": major
---

Pass the CoinModuleApi context to the Canton logic and the resolved config to its network layer, move `common-logic` to a flat `logic` folder, and return 0 from `getNextSequence`. `createBridges` now takes a `Context` instead of seeding a module-level coin config, and the bridge logs through `context.logger`.
