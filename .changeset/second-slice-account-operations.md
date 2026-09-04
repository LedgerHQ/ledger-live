---
"@devtools/account-operations": minor
"@devtools/bindings": minor
"@devtools/registry": minor
"@ledgerhq/live-common": minor
"@domain/entity-account-operations": minor
"@features/platform-account-data": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/wallet-cli": minor
---

Read an account's operation history one page at a time — the second slice of the account data layer,
built to falsify the first one's design.

`@domain/entity-account-operations` holds a **window** onto a history rather than the history: the
loaded operations, the cursor to resume from, whether the window is complete, when the head was last
read, and the total when a source can report one. Rows are flat — a token transfer and an internal
call are sibling rows carrying `parentOperationId`, not members nested inside their parent — so a
token account's history no longer means walking its parent's, and the legacy shape can still be
reconstructed from the flat one.

`@features/platform-account-data` gains `AccountOperationsSource` and two verbs:
`fetchAccountOperations` reads the head and is freshness-guarded, `fetchMoreAccountOperations` reads
the next page and deliberately is not. `pickSource` is now generic and otherwise unchanged.

In live-common, `account-data/operations` reads one page through the coin module's `listOperations`
(keying token transfers onto their token account, which the granular path has to do by hand) or
projects a whole bridge sync, and `legacy-mapping/accountOperation` owns the `Account →
AccountOperation[]` projection. `syncAccountOnce` is extracted so both full-sync sources share one set
of abort semantics.

The history gate defaults to **empty** — every family reads through the full sync in both wallets and
in wallet-cli, because `listOperations` parity is unproven. web-tools turns it on so the difference
between the two sources is observable. A family being granular for `balance` says nothing about
`operations`, and that per-datum asymmetry is the strongest argument the exercise has produced for
slicing at all.

`@devtools/account-operations` is the tool that makes it observable: `Load more` is disabled on a
source that cannot resume from a cursor, the count reads `total unknown, the window is partial` until
the history is complete, and nested rows and rows that landed on a token account are tagged as such.
It takes the same inputs as the balances tool — only the datum differs.

What survived the second slice unchanged and what broke — including that `operationsCount` is not
knowable from a page, and that the portfolio graph needs a *bounded* window rather than the whole
history — is written up in `docs/account-data-layer.md`.
