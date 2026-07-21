---
"@ledgerhq/live-signer-icp": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": patch
"@shared/feature-flags": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Introduce the DMK-based Internet Computer signer behind the `ldmkInternetComputerSigner` feature flag.

Add `@ledgerhq/live-signer-icp`, exposing `DmkSignerICP` (backed by the Device Management Kit `@ledgerhq/device-signer-kit-icp`) and `LegacySignerICP` (the `@zondax/ledger-icp` transport, relocated here from `ledger-live-common`). The Internet Computer family setup now selects between them at runtime; the legacy signer remains the default until the flag is enabled. `getAppConfiguration` is added to the `ICPSigner` contract to support version gating.
