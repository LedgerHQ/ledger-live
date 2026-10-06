---
"@ledgerhq/coin-solana": patch
"@ledgerhq/ledger-wallet-framework": patch
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

chore: take `uuid` from the pnpm catalog (11.1.0)

`uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).
