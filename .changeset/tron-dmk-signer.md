---
"@ledgerhq/live-signer-tron": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.
