---
"@ledgerhq/coin-tron": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain. coin-tron now quotes and pays the Tronify rent in USDT instead of TRX, offers it on USDT transfers only, and defaults to the Ledger Tronify proxy.
