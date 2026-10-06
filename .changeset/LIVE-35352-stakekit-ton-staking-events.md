---
"@ledgerhq/transaction-observability": minor
---

Report `earn_transaction_*` for the StakeKit, Kiln DeFi and P2P TON stake programs.

`kiln-widget` (Kiln DeFi) is now on the staking-app allow list, so its stablecoin vault deposits reach Segment. Its ERC-4626 `deposit`, `withdraw` and `redeem` calls already map. It reports no `staking_method`, because a lending yield fits none of them. The built-in stake-program list now includes `p2p-ton-staking`, and it is typed against the allow list, so a stake program that Segment would drop fails to compile.

StakeKit's EVM stakes (bsc, avalanche_c_chain, POL and USDe on ethereum) are contract calls with no staking `mode`, so they had no action and were dropped. `stakekit` is now on the staking-app allow list, so they emit, with an unmapped function reported as `transaction_type: unknown` and its selector in `raw_transaction_type`. StakeKit reports no `staking_method`: one manifest stakes natively, liquidly and through validators. Its native routes (tron, crypto_org, assethub_polkadot) already emitted and keep their family wording. Observed runs confirm USDe `deposit`, AVAX `submit` → `deposit`, and POL `buyVoucherPOL` → `delegate`: each Polygon validator has its own ValidatorShare contract, so the call names a validator. BSC is not yet observed and reports its selector until it is. AVAX calls `submit` on sAVAX itself, so the contract map now reports it as `liquid` with `output_currency: sAVAX`, checked against CAL like the ETH receipt tokens.

TON has no `mode`, so its action is now read from what the signer signs: `payload.type`, or a non-empty top-level comment, which replaces the payload. `tonstakers-deposit` and `tonwhales-pool-deposit` are deposits, and `tonwhales-pool-withdraw` and `single-nominator-withdraw` are withdraws. `jetton-burn` stays unmapped, because a Tonstakers unstake and any other burn look the same. `p2p-ton-staking` is on the allow list as pooled staking.

A P2P deposit carries no payload: it is a plain transfer to the pool with the comment `Deposit`. Inside `p2p-ton-staking` only, an unencrypted comment of exactly `Deposit` is classified, and reported as the fixed `raw_transaction_type` `pool-comment-deposit`. The comment text itself is never reported, and the same comment outside a staking app classifies nothing. A P2P withdrawal needs nothing new: it sends the `tonwhales-pool-withdraw` payload.

`contract_address` is now only ever reported for EVM. With StakeKit and P2P allow-listed, a native or TON stake reached the contract fallback, which reported its recipient, lower-cased, as a contract. Lower-casing also corrupts TON's case-sensitive addresses.

These three manifests come from the `stakePrograms` remote config, not from the Earn API, so the drift guard does not cover them.
