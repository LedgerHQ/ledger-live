---
"live-mobile": minor
"@ledgerhq/live-common": patch
"@shared/feature-flags": patch
---

Forward the resolved `llmWalletApiDeviceIntentSign` value to the swap live app as a webview input on mobile, so the live app can adapt to the device-intent signing flow. The value is resolved per manifest through the new shared `useDeviceIntentSignEnabled` hook, which also replaces the duplicated flag/allowlist logic in the Wallet API UI hook. Report the flag's enabled state and `variantId` on Mixpanel events via `getRemoteABTestingAttributes`.
