---
"@domain/entity-market-countervalues": minor
"@domain/api-market-countervalues": minor
---

Make countervalues rate patches copy-on-write.

- `applyRatePatches` no longer writes into the rate `Map`s it is given. A patched pair gets a new `Map`, the other pairs keep theirs, and the `data` and `cache` objects of `next` are left untouched.
- `loadCountervalues` therefore leaves the state it loads from unchanged, so its result can be kept in a store that freezes its state (immer, behind `createSlice`) and passed back on the next poll. Before, the second poll on such a store threw and rates stopped updating.
- The loaded state, the persisted export and the moment it is saved are unchanged.
