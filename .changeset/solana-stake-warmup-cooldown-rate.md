---
"@ledgerhq/coin-solana": minor
---

fix(coin-solana): drop warmupCooldownRate from stake schema

Agave removed `warmupCooldownRate` from `UiDelegation` in 4.1 (deprecated since 1.16.7 in
favour of `solana_stake_interface::state::warmup_cooldown_rate()`), and mainnet now serves
`apiVersion: 4.1.0`. Our `Delegation` struct still required it, so parsing threw a
`StructError` for any account holding stake accounts — breaking the legacy sync path
(`synchronization.ts`) as well as `logic/getStakes` and `logic/getBalance`.

The field was never read: the activation math uses a hardcoded `WARMUP_COOLDOWN_RATE`, as
upstream recommends. Dropping it from the schema restores parsing with no behaviour change.
