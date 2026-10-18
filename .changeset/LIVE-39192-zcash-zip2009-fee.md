---
"@ledgerhq/coin-zcash": minor
---

Select the Zcash fee per logical action from the account's synced height and network (ZIP 2009): 1,000 zatoshis from mainnet height 3,590,000 (applied 100 blocks late) and on test networks, 5,000 before. Bump `@ledgerhq/zcash-utils` to 2.7.0. The mainnet switch height can be delayed or the switch disabled through the optional `zip2009.mainnetHeight` coin-config setting (`null` disables it); a height below 3,590,000 is raised to it.
