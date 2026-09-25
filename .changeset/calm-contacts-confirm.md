---
"ledger-live-mobile-e2e-tests": patch
"@ledgerhq/live-e2e-shared": patch
"@ledgerhq/live-dmk-mobile": patch
"live-mobile": patch
"@features/flow-contacts": patch
---

Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.
