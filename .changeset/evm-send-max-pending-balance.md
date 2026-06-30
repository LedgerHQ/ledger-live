---
"@ledgerhq/live-common": patch
---

Fix "send max" offering already-committed funds while a previous send is still pending. Optimistic pending operations are now subtracted from the spendable balance used by the generic coin framework (send max, amount and gas validation), preventing on-chain "Insufficient funds for gas * price + value" errors when sending again before the next account sync. Affects EVM and other coins built on the generic coin framework. Sponsored (gasless) pending transactions no longer lock their fee against the native balance, since the fee is paid by a third party and not by the account.
