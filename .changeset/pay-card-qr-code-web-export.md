---
"@shared/ui-qr-code": minor
"@features/flow-contacts": patch
---

Add `@shared/ui-qr-code` (renamed from `@shared/qr-code`) with a web export of `QrCode` so it renders on both web and native from a single API. Web draws via `qrcode` on a canvas, native keeps `react-native-qrcode-svg`, and both accept a free `centerContent` slot for a centered icon or logo (LIVE-36118).
