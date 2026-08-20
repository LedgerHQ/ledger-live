---
"live-mobile": minor
"@ledgerhq/live-common": patch
"@shared/feature-flags": patch
---

Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile (`variantId`, flag `enabled`, and whether DIE signing is active for the current manifest). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report `enabled` and `variantId` on Mixpanel via `getRemoteABTestingAttributes`.
