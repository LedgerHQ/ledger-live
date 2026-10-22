---
"live-mobile": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@ledgerhq/live-dmk-mobile": patch
---

Run the custom.exchange device steps (nonce, Exchange app confirmation, signature) and their errors of wallet-api live apps in the Device Intent Executor drawer, behind the llmWalletApiDeviceIntentExchange flag, and send its A/B assignment to analytics and the swap live app. Keep the httpdebug compat device id of HTTP proxy devices instead of prefixing it with usb|
