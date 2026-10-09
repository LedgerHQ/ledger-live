---
"live-mobile": minor
---

feat(notifications): open the push notifications opt-in drawer from a deeplink

`ledgerlive://notifications-opt-in` opens the opt-in drawer with the new `deeplink` source, so a Braze
in-app message can re-prompt users who tapped "allow" but never granted the Android 13+ OS
permission (LIVE-38950). The deeplink is ignored before onboarding is completed or when
`brazePushNotifications` is disabled.
