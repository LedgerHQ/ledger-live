---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`
