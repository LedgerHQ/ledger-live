---
"@ledgerhq/coin-bitcoin": minor
---

Report what a Zcash transaction actually did, rather than what an explorer can infer from its transparent bundle. An explorer that sees only the transparent side is wrong about two things whenever value crosses a shielded boundary:

- **The fee**, derived as `Σ transparent inputs − Σ transparent outputs`, swallows any value that entered a shielded pool: a transparent-to-shielded send of 0.1 ZEC paying 0.00055 in fees was reported as having paid 0.10055.
- **The destination**, since the payee lives in an encrypted output, fell back to the transparent change address — which pays the sender back rather than the payee.

Both are now recovered from the raw transaction in a single fetch, through a `transactionDetails` method on the ZCash client (native and IPC) backed by `@ledgerhq/zcash-utils`: the fee from the value balance of every pool, the payee by trial-decrypting our own outputs with the account's viewing key.

A new `resolveTransactionDetails` chain-adapter hook applies fees to transactions before operations are derived, so a transaction's sender and recipient agree on its cost, and supersedes the change address with the recovered payee while keeping any genuine transparent recipient. When an optimistic operation is reconciled with its confirmed counterpart, the address the user actually entered is preferred over the recovered one, which is the same destination but not necessarily the same string. A transaction that cannot be resolved keeps the fee and recipients the explorer reported.
