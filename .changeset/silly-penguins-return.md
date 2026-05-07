---
"@ledgerhq/coin-tezos": minor
---

Migrate Tezos integration tests off Ghostnet to Shadownet (Ghostnet was deprecated in early 2026, its TzKT and RPC endpoints stopped resolving). Pinned a persistent Shadownet test account (`tz1dKrT1...`) with reveal/delegation/stake/unstake history, plus a tz2 (`tz29GPjg...`) and a registered baker as a delegate target. `getBlock` and `getBlockInfo` integ tests now pin block 3113219. `craftTransaction.integ.test.ts` only had a stale Ghostnet docstring — updated to reflect that it actually runs against mainnet via the Ledger vault explorer.
