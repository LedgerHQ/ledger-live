---
"@ledgerhq/coin-solana": minor
---

Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

The coin module can now craft and price every command the family exposes — a stake creation, delegation, deactivation and withdrawal, a token account opening, an approval and a revocation, and a transaction a partner already built — and charges each its true cost, including an associated token account's rent and the reserve a new stake account must keep to be unstaked later. Token-2022 transfer fees are computed in both directions, so sending a maximum amount no longer overshoots.

A stake split and a token account opening are now priced on their own dummy transaction rather than on an unrelated one, and a fee estimate is measured on the token program the crafted transaction will actually use — read off the mint, as crafting reads it. Opening an associated token account for a Token-2022 mint declares that program, so the address the account is created at matches the one it was derived from.

One change reaches the legacy send flow, which shares `broadcast`: a transaction the cluster did not confirm in time now surfaces as a named timeout error rather than a bare one, and a failed simulation is logged before it is thrown.
