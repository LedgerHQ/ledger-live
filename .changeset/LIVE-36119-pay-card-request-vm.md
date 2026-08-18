---
"@features/flow-pay-card-request": minor
---

Add the shared, pure Pay Card Request receive view-model `useRequestReceiveViewModel` to `@features/flow-pay-card-request`: it formats the injected asset/network/address into display data (split address parts, QR payload) and wraps the host-owned share/copy/save/verify callbacks with `button_clicked` tracking via the injected `onTrackEvent`. No Redux, navigation, device I/O, i18n or domain dependencies.
