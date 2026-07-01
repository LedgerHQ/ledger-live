---
"@ledgerhq/types-live": minor
"@features/platform-feature-flags": minor
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
---

Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.
