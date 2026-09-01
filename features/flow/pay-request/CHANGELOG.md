# @features/flow-pay-request

## 0.2.0

### Minor Changes

- [#20873](https://github.com/LedgerHQ/ledger-live/pull/20873) [`e6ad2f6`](https://github.com/LedgerHQ/ledger-live/commit/e6ad2f6eed4bf5e587a2880e7fa7be937e2764ee) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the shared, pure Pay Card Request receive view-model `useRequestReceiveViewModel` to `@features/flow-pay-card-request`: it formats the injected asset/network/address into display data (split address parts, QR payload) and wraps the host-owned share/copy/save/verify callbacks with `button_clicked` tracking via the injected `onTrackEvent`. No Redux, navigation, device I/O, i18n or domain dependencies.

- [#20962](https://github.com/LedgerHQ/ledger-live/pull/20962) [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab Request "Verify" action: pressing it closes the receive dialog and opens the shared VerifyAddress overlay (intro then success), tracking the `Page Request Address Verification` page view. The device intent (DIE) is kept behind the exposed `showSuccess` bridge for LIVE-36132.

  Make the request action `onShare` (mobile-only) and `onSave` (desktop-only) callbacks optional, align the request verify tracking button to `verify`, and give the VerifyAddress dialog an InfoState-style muted background with centered next steps.

- [#20938](https://github.com/LedgerHQ/ledger-live/pull/20938) [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a branded `QrCode` (asset icon in the center) on Pay Card request receive (LIVE-36233).

- [#20898](https://github.com/LedgerHQ/ledger-live/pull/20898) [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web RequestReceive dialog (asset icon, network row, highlighted address, action tiles) and wire the Pay tab Request tile on desktop to open it with copy support (LIVE-36120).

- [#20857](https://github.com/LedgerHQ/ledger-live/pull/20857) [`33007b1`](https://github.com/LedgerHQ/ledger-live/commit/33007b1c0a68912d2cebecd96edb2fe797df17dd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the @features/flow-pay-card-request dual-platform flow package (empty public API) so the Pay tab Request receive-screen component and view-model can be added in follow-up tickets.

- [#20953](https://github.com/LedgerHQ/ledger-live/pull/20953) [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Save the Pay request card (QR + address) as a PNG image through the native OS save dialog

### Patch Changes

- Updated dependencies [[`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20)]:
  - @shared/ui-qr-code@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#20873](https://github.com/LedgerHQ/ledger-live/pull/20873) [`e6ad2f6`](https://github.com/LedgerHQ/ledger-live/commit/e6ad2f6eed4bf5e587a2880e7fa7be937e2764ee) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the shared, pure Pay Card Request receive view-model `useRequestReceiveViewModel` to `@features/flow-pay-card-request`: it formats the injected asset/network/address into display data (split address parts, QR payload) and wraps the host-owned share/copy/save/verify callbacks with `button_clicked` tracking via the injected `onTrackEvent`. No Redux, navigation, device I/O, i18n or domain dependencies.

- [#20962](https://github.com/LedgerHQ/ledger-live/pull/20962) [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab Request "Verify" action: pressing it closes the receive dialog and opens the shared VerifyAddress overlay (intro then success), tracking the `Page Request Address Verification` page view. The device intent (DIE) is kept behind the exposed `showSuccess` bridge for LIVE-36132.

  Make the request action `onShare` (mobile-only) and `onSave` (desktop-only) callbacks optional, align the request verify tracking button to `verify`, and give the VerifyAddress dialog an InfoState-style muted background with centered next steps.

- [#20938](https://github.com/LedgerHQ/ledger-live/pull/20938) [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a branded `QrCode` (asset icon in the center) on Pay Card request receive (LIVE-36233).

- [#20898](https://github.com/LedgerHQ/ledger-live/pull/20898) [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web RequestReceive dialog (asset icon, network row, highlighted address, action tiles) and wire the Pay tab Request tile on desktop to open it with copy support (LIVE-36120).

- [#20857](https://github.com/LedgerHQ/ledger-live/pull/20857) [`33007b1`](https://github.com/LedgerHQ/ledger-live/commit/33007b1c0a68912d2cebecd96edb2fe797df17dd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the @features/flow-pay-card-request dual-platform flow package (empty public API) so the Pay tab Request receive-screen component and view-model can be added in follow-up tickets.

- [#20953](https://github.com/LedgerHQ/ledger-live/pull/20953) [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Save the Pay request card (QR + address) as a PNG image through the native OS save dialog

### Patch Changes

- Updated dependencies [[`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20)]:
  - @shared/ui-qr-code@0.3.0-next.0
