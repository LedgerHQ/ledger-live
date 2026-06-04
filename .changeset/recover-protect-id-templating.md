---
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Make Recover URI templating actually replace `protectId`, drop unused `protectServicesDesktop` / `protectServicesMobile` params, and replace `compatibleDevices` with a hardcoded Nano S exclusion in `isRecoverDisplayed`.

`useReplacedURI` previously only rewrote the placeholders `protect-simu`, `protect-local-dev` and `protect-staging`, so any URI hard-coded with `protect-prod` (e.g. the values shipped to PROD via Firebase Remote Config) was never re-templated when `protectId` changed. Switching the active Recover environment therefore required a manual find-and-replace across every URI in the feature flag. The regex now matches any `protect-<env>` segment, which is a no-op when `protectId` already equals that segment and a true substitution otherwise.

`compatibleDevices` is replaced by a hardcoded check in `isRecoverDisplayed` — Nano S is the only device that does not support Recover and the rule is not expected to change. Dropping the array from the schema keeps the FF lean and removes the need to update Remote Config when a new device is supported.

Also remove keys that have no consumer in either app — `isNew`, `ledgerliveStorageState`, `onboardingCompleted.alreadySubscribedURI`, and the entire `onboardingRestore` block on desktop; `ledgerliveStorageState`, `restoreInfoDrawer.manualStepsURI`, `managerStatesData.NEW.learnMoreURI` and `managerStatesData.NEW.alreadySubscribedURI` on mobile. `usePostOnboardingURI` is narrowed to `Feature_ProtectServicesMobile` since it is only called from the mobile app. Unknown keys still in Firebase are silently stripped by Zod, so this is forward-compatible with existing Remote Config payloads.
