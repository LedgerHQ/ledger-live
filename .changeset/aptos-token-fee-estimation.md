---
"@ledgerhq/coin-aptos": minor
---

Fix network fees showing 0 when sending an Aptos token with an amount whose raw value exceeds the native APT balance. Fee estimation is now gated by the token balance instead of the native balance.
