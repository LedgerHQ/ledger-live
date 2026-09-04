# @features/flow-pay-request

## 0.3.0-next.0

### Minor Changes

- [#21092](https://github.com/LedgerHQ/ledger-live/pull/21092) [`dd9fe60`](https://github.com/LedgerHQ/ledger-live/commit/dd9fe60055d1b97a175bb701d98129c79a1ef33b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add the native Pay Request receive stack screen (close, QR, share, copy, verify).

- [#21164](https://github.com/LedgerHQ/ledger-live/pull/21164) [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire Pay Request Verify on mobile (intro sheet, DIE address confirmation, tracking).
  Share `getAddressVerification` (maps refuse / unsupported) in the platform intent package.

- [#21118](https://github.com/LedgerHQ/ledger-live/pull/21118) [`6f8acaf`](https://github.com/LedgerHQ/ledger-live/commit/6f8acaf912c5c515a8fb05382101785fded8bb06) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Share the Pay request card as a PNG from the native Share action

- [#21266](https://github.com/LedgerHQ/ledger-live/pull/21266) [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the request receive save helpers and the summary test id to drop their redundant "card" suffix

- [#21145](https://github.com/LedgerHQ/ledger-live/pull/21145) [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Rename the Pay request flow package from `@features/flow-pay-card-request` to `@features/flow-pay-request`.

### Patch Changes

- Updated dependencies [[`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba)]:
  - @shared/ui-queued-bottom-sheet@0.2.0-next.0
  - @shared/ui-qr-code@0.4.0-next.0

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
