# @features/platform-contacts

## 0.7.0

### Minor Changes

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

### Patch Changes

- Updated dependencies [[`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2)]:
  - @shared/feature-flags@0.23.0
  - @features/platform-feature-flags@0.7.0
  - @domain/entity-contact@0.9.0

## 0.7.0-next.0

### Minor Changes

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

### Patch Changes

- Updated dependencies [[`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2)]:
  - @shared/feature-flags@0.23.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @domain/entity-contact@0.9.0-next.0

## 0.6.0

### Minor Changes

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21462](https://github.com/LedgerHQ/ledger-live/pull/21462) [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix registered contacts never reaching the Ethereum signer's address book

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d)]:
  - @shared/feature-flags@0.22.0
  - @domain/entity-currency-crypto@0.12.0
  - @features/platform-feature-flags@0.6.9
  - @domain/entity-contact@0.8.2
  - @domain/entity-currency-token@0.5.2

## 0.6.0-next.1

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @features/platform-feature-flags@0.6.9-next.1

## 0.6.0-next.0

### Minor Changes

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21462](https://github.com/LedgerHQ/ledger-live/pull/21462) [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix registered contacts never reaching the Ethereum signer's address book

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d)]:
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @shared/feature-flags@0.22.0-next.0
  - @domain/entity-contact@0.8.2-next.0
  - @domain/entity-currency-token@0.5.2-next.0
  - @features/platform-feature-flags@0.6.9-next.0

## 0.5.0

### Minor Changes

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21234](https://github.com/LedgerHQ/ledger-live/pull/21234) [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the keyboard flickering open and shut on the Mobile edit contact drawer, which focused its name field as soon as it mounted and so raised the keyboard into a drawer that was still animating. The field now waits for its drawer to settle before taking focus, as the add contact drawer already did, and focus is opt-in so no other drawer can raise the keyboard by accident.

  Also give the add contact, edit contact and Send add new contact drawers the same keyboard clearance as the add address and edit address drawers, so every contact drawer leaves the same gap above the keyboard on iOS instead of sitting flush against it.

- [#21220](https://github.com/LedgerHQ/ledger-live/pull/21220) [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the Contacts device intent renderers into the apps.

  `@features/platform-contacts/device/intents` now exports component-less
  `IntentDefinition`s. Each app owns its renderers under
  `src/mvvm/features/Contacts/deviceIntents/`, composes them into
  `IntentPlatformDefinition`s and injects them into `useContactsIntentsOrchestrator`,
  which no longer imports a production intent implementation.

  A `features/` package cannot resolve translations today, so a renderer that shows
  translated copy has to live in the app.

- [#21128](https://github.com/LedgerHQ/ledger-live/pull/21128) [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Orchestrate Contacts device confirmations through the Device Intent Executor.

- [#21236](https://github.com/LedgerHQ/ledger-live/pull/21236) [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Register an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.registerExternalAddress()`, each failure gets its own JobState (app version too low, invalid input, device rejected, existing-group verification failed, unsupported operation, device error), and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

- [#21185](https://github.com/LedgerHQ/ledger-live/pull/21185) [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add shared Contacts kit wiring: version-requirement wrappers over `@ledgerhq/device-contacts-kit`, composed with each app's app-global floor into the Contacts device intents' minimum app-version floor.

- [#21320](https://github.com/LedgerHQ/ledger-live/pull/21320) [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the reusable Contact deletion journey into its own flow package and move shared Contacts confirmation presentation to Platform Contacts.

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21287](https://github.com/LedgerHQ/ledger-live/pull/21287) [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Order Pay contacts by last sent-to, then last added, derived at read time from account OUT operations

- [#21245](https://github.com/LedgerHQ/ledger-live/pull/21245) [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

  `toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

  Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.

- [#21334](https://github.com/LedgerHQ/ledger-live/pull/21334) [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Match incoming and outgoing wallet operations to contacts.

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @domain/entity-currency-crypto@0.11.0
  - @shared/feature-flags@0.21.0
  - @features/platform-device-intent@5.2.0
  - @domain/entity-contact@0.8.1
  - @domain/entity-currency-token@0.5.1
  - @features/platform-feature-flags@0.6.8

## 0.5.0-next.0

### Minor Changes

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21234](https://github.com/LedgerHQ/ledger-live/pull/21234) [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the keyboard flickering open and shut on the Mobile edit contact drawer, which focused its name field as soon as it mounted and so raised the keyboard into a drawer that was still animating. The field now waits for its drawer to settle before taking focus, as the add contact drawer already did, and focus is opt-in so no other drawer can raise the keyboard by accident.

  Also give the add contact, edit contact and Send add new contact drawers the same keyboard clearance as the add address and edit address drawers, so every contact drawer leaves the same gap above the keyboard on iOS instead of sitting flush against it.

- [#21220](https://github.com/LedgerHQ/ledger-live/pull/21220) [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the Contacts device intent renderers into the apps.

  `@features/platform-contacts/device/intents` now exports component-less
  `IntentDefinition`s. Each app owns its renderers under
  `src/mvvm/features/Contacts/deviceIntents/`, composes them into
  `IntentPlatformDefinition`s and injects them into `useContactsIntentsOrchestrator`,
  which no longer imports a production intent implementation.

  A `features/` package cannot resolve translations today, so a renderer that shows
  translated copy has to live in the app.

- [#21128](https://github.com/LedgerHQ/ledger-live/pull/21128) [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Orchestrate Contacts device confirmations through the Device Intent Executor.

- [#21236](https://github.com/LedgerHQ/ledger-live/pull/21236) [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Register an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.registerExternalAddress()`, each failure gets its own JobState (app version too low, invalid input, device rejected, existing-group verification failed, unsupported operation, device error), and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

- [#21185](https://github.com/LedgerHQ/ledger-live/pull/21185) [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add shared Contacts kit wiring: version-requirement wrappers over `@ledgerhq/device-contacts-kit`, composed with each app's app-global floor into the Contacts device intents' minimum app-version floor.

- [#21320](https://github.com/LedgerHQ/ledger-live/pull/21320) [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the reusable Contact deletion journey into its own flow package and move shared Contacts confirmation presentation to Platform Contacts.

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21287](https://github.com/LedgerHQ/ledger-live/pull/21287) [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Order Pay contacts by last sent-to, then last added, derived at read time from account OUT operations

- [#21245](https://github.com/LedgerHQ/ledger-live/pull/21245) [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

  `toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

  Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.

- [#21334](https://github.com/LedgerHQ/ledger-live/pull/21334) [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Match incoming and outgoing wallet operations to contacts.

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @shared/feature-flags@0.21.0-next.0
  - @features/platform-device-intent@5.2.0-next.0
  - @domain/entity-contact@0.8.1-next.0
  - @domain/entity-currency-token@0.5.1-next.0
  - @features/platform-feature-flags@0.6.8-next.0

## 0.4.0

### Minor Changes

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20966](https://github.com/LedgerHQ/ledger-live/pull/20966) [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Scaffold Contacts Device Intent Executor contracts and colocate platform definitions

- [#20748](https://github.com/LedgerHQ/ledger-live/pull/20748) [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Allow editing the saved wallet address in Contacts Edit Address flow, with the same validation as Add Address.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20855](https://github.com/LedgerHQ/ledger-live/pull/20855) [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Lumen decorative palette for saved contact avatars on desktop.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @domain/entity-contact@0.8.0
  - @features/platform-device-intent@5.1.0
  - @shared/feature-flags@0.20.0
  - @features/platform-feature-flags@0.6.7

## 0.4.0-next.0

### Minor Changes

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20966](https://github.com/LedgerHQ/ledger-live/pull/20966) [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Scaffold Contacts Device Intent Executor contracts and colocate platform definitions

- [#20748](https://github.com/LedgerHQ/ledger-live/pull/20748) [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Allow editing the saved wallet address in Contacts Edit Address flow, with the same validation as Add Address.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20855](https://github.com/LedgerHQ/ledger-live/pull/20855) [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Lumen decorative palette for saved contact avatars on desktop.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-device-intent@5.1.0-next.0
  - @shared/feature-flags@0.20.0-next.0
  - @features/platform-feature-flags@0.6.7-next.0

## 0.3.0

### Minor Changes

- [#20734](https://github.com/LedgerHQ/ledger-live/pull/20734) [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb) Thanks [@deepyjr](https://github.com/deepyjr)! - Align contact avatar initials and sizes across Web and Native, including 48px contact icons in the Mobile list.

- [#20570](https://github.com/LedgerHQ/ledger-live/pull/20570) [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add typed Device Intent data and a Cloud Sync document for Contacts.

- [#20682](https://github.com/LedgerHQ/ledger-live/pull/20682) [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared Contacts analytics global properties in platform-contacts and the typed tracking contract helper in flow-contacts.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20676](https://github.com/LedgerHQ/ledger-live/pull/20676) [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose the reusable Contacts avatar renderer from Platform Contacts, including the Me profile image.

### Patch Changes

- Updated dependencies [[`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-contact@0.7.0
  - @domain/entity-currency-token@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#20734](https://github.com/LedgerHQ/ledger-live/pull/20734) [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb) Thanks [@deepyjr](https://github.com/deepyjr)! - Align contact avatar initials and sizes across Web and Native, including 48px contact icons in the Mobile list.

- [#20570](https://github.com/LedgerHQ/ledger-live/pull/20570) [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add typed Device Intent data and a Cloud Sync document for Contacts.

- [#20682](https://github.com/LedgerHQ/ledger-live/pull/20682) [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared Contacts analytics global properties in platform-contacts and the typed tracking contract helper in flow-contacts.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20676](https://github.com/LedgerHQ/ledger-live/pull/20676) [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose the reusable Contacts avatar renderer from Platform Contacts, including the Me profile image.

### Patch Changes

- Updated dependencies [[`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-contact@0.7.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0

## 0.2.0

### Minor Changes

- [#20537](https://github.com/LedgerHQ/ledger-live/pull/20537) [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts list journey into its own flow package, expose the parent Contacts view orchestrator, and share contact display-name helpers through Platform.

- [#20523](https://github.com/LedgerHQ/ledger-live/pull/20523) [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Add contact journey into dedicated Contacts platform and flow packages while preserving the Contacts flow facade.

- [#20653](https://github.com/LedgerHQ/ledger-live/pull/20653) [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add formatting checks to Contacts packages.

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

### Patch Changes

- Updated dependencies [[`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937)]:
  - @domain/entity-contact@0.6.0

## 0.2.0-next.0

### Minor Changes

- [#20537](https://github.com/LedgerHQ/ledger-live/pull/20537) [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts list journey into its own flow package, expose the parent Contacts view orchestrator, and share contact display-name helpers through Platform.

- [#20523](https://github.com/LedgerHQ/ledger-live/pull/20523) [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Add contact journey into dedicated Contacts platform and flow packages while preserving the Contacts flow facade.

- [#20653](https://github.com/LedgerHQ/ledger-live/pull/20653) [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add formatting checks to Contacts packages.

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

### Patch Changes

- Updated dependencies [[`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937)]:
  - @domain/entity-contact@0.6.0-next.0
