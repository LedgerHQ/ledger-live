---
"@ledgerhq/live-common": patch
---

fix(zcash): expose only the transparent balance to live apps

Swap, buy/sell and dApps read an account's spendable balance over the wallet-api. For Zcash that reported transparent + private, so the swap form displayed — and offered as MAX — private funds a live app cannot spend. It now reports the transparent balance, the same figure as the account page's "Transparent" label.
