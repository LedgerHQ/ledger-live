---
"live-mobile": minor
---

Filter the Asset Detail "Send crypto" flow by the asset's networks: the "Account to debit" screen now lists only accounts holding the asset across all of its networks (e.g. both USDT accounts on Ethereum and Algorand), reusing the multi-network `ledgerIds` resolved for the Receive flow, instead of showing the full unfiltered account list.
