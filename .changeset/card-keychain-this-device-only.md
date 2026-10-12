---
"@features/platform-card": minor
"@features/flow-pay-card-auth": minor
---

Keep the Card session tokens and the PKCE attempt on this device only. The keychain entries move from `AFTER_FIRST_UNLOCK` to `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so an iOS backup restored onto another phone no longer carries a signed-in Card session. Background reads still work once the device has been unlocked after boot. Existing entries take the new level the next time they are written.
