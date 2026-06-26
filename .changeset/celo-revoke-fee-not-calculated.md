---
"@ledgerhq/coin-celo": patch
---

celo: fix revoke vote fee not being calculated. The revoke fee estimation now reuses buildTransaction so it uses the correct lesser/greater neighbors and revoke value, and falls back to a minimum gas estimate instead of returning a 0 fee on estimation failure (which left the Continue button disabled). Also matches the validator group case-insensitively in getVote.
