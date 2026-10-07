---
"@ledgerhq/live-signer-casper": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `@ledgerhq/live-signer-casper`, wrapping `@ledgerhq/device-signer-kit-casper` as `DmkSignerCasper`
alongside the legacy `@zondax/ledger-casper` path as `LegacySignerCasper`. `families/casper` picks
between them, using the DMK signer only on a DMK transport with the new `ldmkCasperSigner` feature
flag on. The flag is disabled by default, so Casper keeps signing through `@zondax/ledger-casper`.
