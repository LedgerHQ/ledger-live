# @ledgerhq/transaction-observability

## 0.3.0-next.0

### Minor Changes

- [#21250](https://github.com/LedgerHQ/ledger-live/pull/21250) [`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for ETH dApp and live-app staking.

  A contract call carries no staking `mode`, so the action came back undefined and every Lido, Kiln, Stader, Kelp, Coinbase, Chorus One, Figment and P2P transaction was dropped. Two signals now classify it, each read at the stage that has it: the action from the call data at sign, the originating app from the manifest.

  Neither works alone. A selector is the keccak hash of a function signature, not a statement of intent — `0xd0e30db0` is `deposit()` on WETH, wrapping ETH, as readily as it is a vault entry — so call data is only ever read inside a known staking app. The manifest, in turn, says the user was in Lido but not whether they staked or withdrew.

  The two vocabularies are kept in separate maps because they disagree: a generic-framework `mode` of `stake` picks a validator and means `delegate`, while a function named `stake` enters a pool and means `deposit`. A family mode always wins, so EVM chains that stake natively — sei_evm, monad, somnia, zero_gravity — keep their own wording and never fall through to call data.

  An allow-listed app calling a function the map does not cover is reported with `transaction_type: "unknown"` and the selector in `raw_transaction_type`, rather than dropped. A silent drop is the failure this project exists to remove: this way the gap is countable and the next mapping is obvious.

  Adds `staking_method` (`liquid`, `pooling`, `restaking`, `dedicated`) and restores `redeem` for share-exact ERC-4626 exits. `approve` stays out: ETH staking needs no approval before delegating, so counting one would inflate the funnel's denominator. `kiln-staking` reports no method, because one manifest serves both a pooled and a dedicated product and only a `queryParams.focus` the bridge never sees tells them apart.

  The allow list is held in code, because a gate must not depend on a network call. `stakingApps.integration.test.ts` reads the real Earn API and fails when a provider appears that the list has never heard of, or when a method stops matching its category.

  Reports `contract_address` and `output_currency` too. One lookup on the called contract answers both which token comes out and, for `kiln-staking`, which of its two products this was — a distinction its manifest cannot make, since both share one manifest id.

  The contracts were confirmed by signing and rejecting on device against each provider, which found two things assumption would have missed.

  **The deposit target is usually not the receipt token.** Only Lido mints on its own token. Kelp, Chorus One and Stader all deposit into a pool contract that mints the token at a different address, so a token address is no evidence of a deposit target. That inference was tried and was wrong three times out of five — Kelp most clearly, where the real target turned out to be `0x036676389e…` rather than rsETH.

  **Chorus One calls `deposit_all`**, which the selector list carries separately from `depositAll`. The map lacked that spelling, and it surfaced in the first test because an unmapped call inside a staking app is reported rather than dropped.

  Observed: Lido, Kiln pooled, Coinbase, Chorus One, Kelp. Published but unobserved: Stader, whose wallet connection does not complete.

  A contract is public infrastructure and identical for every user, and it is only ever read for a call inside a known staking app, never for a plain send whose recipient is the user's own payee.

  An unrecognised contract reports neither field rather than defaulting. Guessing `dedicated` for whatever is unmapped would turn one unknown pool into silently wrong data; an absent field is visible, and `contract_address` says exactly what to add.

  Classification also works at the broadcast stage without the sign stage's help. The generic coin framework copies the transaction onto the optimistic operation, so `recipients[0]` is the contract and `transactionRaw` carries the mode plus the call data — confirmed on a completed Lido deposit, where the data arrives as an unprefixed hex string. Correlation stays as enrichment rather than a dependency, which matters on the split wallet-api route, where a signed operation is serialised and object identity is lost.

  Note for anyone querying this: `tx_pathway` is not one value across these providers. Lido is a live app, so it reads `wallet-api/transaction.signAndBroadcast`; the other seven are dApps and read `dApp/eth_sendTransaction`. Both routes go through the same account bridge, so the classification is identical either way — but a query that filters on one pathway will silently miss the rest.

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @shared/env@0.6.0-next.0
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/evm-tools@1.14.3-next.0

## 0.2.0

### Minor Changes

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

  The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

  No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

  `signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

  Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

  Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.

- [#20817](https://github.com/LedgerHQ/ledger-live/pull/20817) [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

  It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

  The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

  Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @shared/env@0.5.0
  - @ledgerhq/types-live@6.122.0

## 0.2.0-next.0

### Minor Changes

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

  The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

  No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

  `signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

  Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

  Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.

- [#20817](https://github.com/LedgerHQ/ledger-live/pull/20817) [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

  It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

  The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

  Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @shared/env@0.5.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
