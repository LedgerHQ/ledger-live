# @features/flow-pay-contact

## 0.3.0-next.0

### Minor Changes

- [#21433](https://github.com/LedgerHQ/ledger-live/pull/21433) [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `ContactAddressPicker` dialog skeleton to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The address list UI and the account/send handoff on address selection land in follow-ups.

- [#21453](https://github.com/LedgerHQ/ledger-live/pull/21453) [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web `ContactAddressPicker` dialog to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The picker lists the contact's addresses segmented by network with asset-aware icons, resolved through the view model, and exposes an optional add-address action that routes to the contact's add-address flow. Address grouping, icon resolution and truncation are shared from `@features/flow-contacts`. The account/send handoff on address selection lands in a follow-up.

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21438](https://github.com/LedgerHQ/ledger-live/pull/21438) [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move Pay contact copy resolution into @features/flow-pay-contact via @shared/i18n so hosts no longer pass translated labels.

- [#21397](https://github.com/LedgerHQ/ledger-live/pull/21397) [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire Pay contact tile press to send (prefill a single-address contact), add a desktop View contact overflow action, and render Lumen `MenuTrigger` `render` props in the shared web passthrough stub.

- [#21537](https://github.com/LedgerHQ/ledger-live/pull/21537) [`a6193dc`](https://github.com/LedgerHQ/ledger-live/commit/a6193dcf861890977c3f36dc8b1618c4403dae75) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a native ContactAddressPicker sheet next to the existing web dialog.

### Patch Changes

- Updated dependencies [[`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca), [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/flow-contacts@0.10.0-next.0
  - @features/platform-contacts@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0
  - @features/flow-contacts-add-contact@0.5.1-next.0
  - @domain/entity-contact@0.8.2-next.0
  - @shared/i18n@0.2.0

## 0.2.0

### Minor Changes

- [#21338](https://github.com/LedgerHQ/ledger-live/pull/21338) [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add View transactions from Pay contacts to History filtered by contact.

- [#21287](https://github.com/LedgerHQ/ledger-live/pull/21287) [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Order Pay contacts by last sent-to, then last added, derived at read time from account OUT operations

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21268](https://github.com/LedgerHQ/ledger-live/pull/21268) [`1ef101a`](https://github.com/LedgerHQ/ledger-live/commit/1ef101ab6487c85c8753cccd8bb9adb0dbd2d489) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Tighten the spacing between the Pay tab contact tiles and align their avatar and label with the design

- [#21133](https://github.com/LedgerHQ/ledger-live/pull/21133) [`aa8f4bf`](https://github.com/LedgerHQ/ledger-live/commit/aa8f4bff9059c9e462d02efb20a1b02fa426939a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the @features/flow-pay-contact dual-platform flow package (empty public API) so the Pay tab contacts strip/table component and view-model can be added in follow-up tickets.

- [#21310](https://github.com/LedgerHQ/ledger-live/pull/21310) [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Display the full list of saved contacts on the desktop Pay tab, ordered by last sent-to then last added

- [#21203](https://github.com/LedgerHQ/ledger-live/pull/21203) [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `Contacts` section (title + empty state with an Add contact CTA) and mount it on the desktop Pay tab. The package reads the contacts and derives the empty state itself; the host injects the copy and an `onAddContact` handler. The add-contact flow and the Ledger Sync gate land in a follow-up.

- [#21281](https://github.com/LedgerHQ/ledger-live/pull/21281) [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cap the mobile Pay contacts strip at 8 and add a see-all control that opens the Contacts flow with a "Pay contact" page title.

- [#21258](https://github.com/LedgerHQ/ledger-live/pull/21258) [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the contacts section to the Pay tab, with a leading Pay tile opening the send flow. Balance, Contacts and Card now share a s24 gap and inherit their horizontal padding from the Pay tab container.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @features/flow-contacts-add-contact@0.5.0
  - @domain/entity-contact@0.8.1

## 0.2.0-next.0

### Minor Changes

- [#21338](https://github.com/LedgerHQ/ledger-live/pull/21338) [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add View transactions from Pay contacts to History filtered by contact.

- [#21287](https://github.com/LedgerHQ/ledger-live/pull/21287) [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Order Pay contacts by last sent-to, then last added, derived at read time from account OUT operations

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21268](https://github.com/LedgerHQ/ledger-live/pull/21268) [`1ef101a`](https://github.com/LedgerHQ/ledger-live/commit/1ef101ab6487c85c8753cccd8bb9adb0dbd2d489) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Tighten the spacing between the Pay tab contact tiles and align their avatar and label with the design

- [#21133](https://github.com/LedgerHQ/ledger-live/pull/21133) [`aa8f4bf`](https://github.com/LedgerHQ/ledger-live/commit/aa8f4bff9059c9e462d02efb20a1b02fa426939a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the @features/flow-pay-contact dual-platform flow package (empty public API) so the Pay tab contacts strip/table component and view-model can be added in follow-up tickets.

- [#21310](https://github.com/LedgerHQ/ledger-live/pull/21310) [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Display the full list of saved contacts on the desktop Pay tab, ordered by last sent-to then last added

- [#21203](https://github.com/LedgerHQ/ledger-live/pull/21203) [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `Contacts` section (title + empty state with an Add contact CTA) and mount it on the desktop Pay tab. The package reads the contacts and derives the empty state itself; the host injects the copy and an `onAddContact` handler. The add-contact flow and the Ledger Sync gate land in a follow-up.

- [#21281](https://github.com/LedgerHQ/ledger-live/pull/21281) [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cap the mobile Pay contacts strip at 8 and add a see-all control that opens the Contacts flow with a "Pay contact" page title.

- [#21258](https://github.com/LedgerHQ/ledger-live/pull/21258) [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the contacts section to the Pay tab, with a leading Pay tile opening the send flow. Balance, Contacts and Card now share a s24 gap and inherit their horizontal padding from the Pay tab container.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.5.0-next.0
  - @domain/entity-contact@0.8.1-next.0
