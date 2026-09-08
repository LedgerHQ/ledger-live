---
"ledger-live-desktop": minor
"live-mobile": minor
"@features/platform-contacts": patch
---

Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable
