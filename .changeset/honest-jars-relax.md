---
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/live-common": minor
---

Stop the generic coin framework silently dropping typed memos (LIVE-35735). Shared `transactionToIntent` emitted a memo shape that predated the framework's memo union — `{ type: memoType, value }` with no `kind`, and `{ type: "NO_MEMO" }` — so a family declaring a typed memo received one its `type === "string" && kind === "…"` guard rejected: the memo resolved to `undefined` and never reached the chain, with no error, which is why it survived the type checker and the migration's unit tests. It now emits the framework's own `StringMemo` (with `memoType` as the `kind`) and `MemoNotSupported` (`{ type: "none" }`), so the note survives for Tron today and for the Cardano, Concordium, Casper and Algorand migrations that read the same shape. The external, pre-union coin-stellar reads `memo.type` as its own Stellar memo kind with a `NO_MEMO` sentinel; its family adapter (`families/stellar/coinModuleApi.ts`) translates the union onto that flat shape at the call boundary, so the shared layer needs no family-specific memo branch.

For Tron this also prices and surfaces the memo now that it reaches the chain: `estimateFees` reads the `getMemoFee` chain parameter (TIP-387) and adds it — along with the memo's bytes to the bandwidth size — for a memo-bearing native or TRC-10 send, falling back to 1 TRX only when chain parameters are unreachable; and sync decodes the memo back out of `raw_data.data` onto the operation's `extra.memo` so it appears in history.
