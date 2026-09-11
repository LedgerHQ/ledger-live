# @features/flow-contacts-edit-address

## 0.3.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1

## 0.3.0-next.0

### Minor Changes

- [#21431](https://github.com/LedgerHQ/ledger-live/pull/21431) [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the extra left padding on the address field of the Mobile add address and edit address drawers. Both screens render the address without the "To:" prefix, but Lumen's AddressInput mounts its prefix even when empty, so the prefix still took a slot in the field's inner gap and pushed the address 8px to the right. Add address now drops that gap and keeps the spacing only between the address and the trailing QR code icon, and edit address, which has no trailing icon, uses a plain TextInput instead.

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0-next.0
  - @domain/entity-contact@0.8.2-next.0

## 0.2.0

### Minor Changes

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21085](https://github.com/LedgerHQ/ledger-live/pull/21085) [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts address drawers so the confirm button stays visible above the keyboard on Android

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @domain/entity-contact@0.8.1

## 0.2.0-next.0

### Minor Changes

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21085](https://github.com/LedgerHQ/ledger-live/pull/21085) [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts address drawers so the confirm button stays visible above the keyboard on Android

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @domain/entity-contact@0.8.1-next.0
