---
"@ledgerhq/live-common": minor
"@ledgerhq/coin-casper": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

- `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
- `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; `CASPER_GENERIC_BRIDGE` env var (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
- Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.
