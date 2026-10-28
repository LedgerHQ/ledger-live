---
"@ledgerhq/coin-aptos": minor
---

fix(coin-aptos): reserve the simulated gas on "use max" sends

A "use max" send always used the default gas limit (200), so a token transfer to a recipient
without a primary store for that asset ran out of gas on-chain. It now reserves at least the
simulated gas.
