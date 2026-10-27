---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
---

Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog
