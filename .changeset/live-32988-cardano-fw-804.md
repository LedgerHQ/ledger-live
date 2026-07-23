---
"@ledgerhq/live-common": minor
---

Support Cardano firmware app v8.0.4 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.4. Also raise the Cardano nano app minVersion to 8.0.4 so users on an incompatible older app are prompted to update instead of hitting broken flows.
