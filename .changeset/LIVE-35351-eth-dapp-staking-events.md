---
"@ledgerhq/transaction-observability": minor
"@ledgerhq/live-common": patch
---

Report `earn_transaction_*` for ETH dApp and live-app staking.

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
