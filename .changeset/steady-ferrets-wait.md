---
"@ledgerhq/coin-tron": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.
