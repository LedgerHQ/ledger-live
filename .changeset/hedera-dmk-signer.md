---
"@ledgerhq/live-signer-hedera": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `@ledgerhq/live-signer-hedera`, with a DMK signer kit for app-hedera (`GetAppConfig`, `GetPublicKey`,
`SignTransaction`) wrapped as `DmkSignerHedera`, alongside the legacy `@ledgerhq/hw-app-hedera` path as
`LegacySignerHedera`. `families/hedera` picks between them, using the DMK signer only on a DMK transport with
the new `ldmkHederaSigner` feature flag on. The flag is disabled by default, so Hedera keeps signing through
`@ledgerhq/hw-app-hedera`.
