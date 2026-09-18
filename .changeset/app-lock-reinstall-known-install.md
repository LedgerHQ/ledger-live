---
"live-mobile": patch
---

Let a reinstall actually clear an app-lock password, as it is meant to.

Protection that outlives its install is destroyed at boot, which is the only way out for someone who has forgotten their password — the sheet on the unlock screen tells them so. Deciding whether protection belongs to this install fell back to "does app storage hold settings", for users whose protection predates the marker that now records an install. The app writes settings within a second of any launch, though, so a fresh install could read its own footprint as history and keep the protection the uninstall was supposed to take away.

The fallback now asks whether onboarding was ever completed, which is the one thing a reinstalled user has not done yet by the time the lock decides, whatever else has already been written to storage.
