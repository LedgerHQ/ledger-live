# @features/flow-account-detail-settings

## 0.1.0

### Minor Changes

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0
  - @shared/ui-info-state@0.5.0
  - @domain/entity-account-name@0.2.3

## 0.1.0-next.0

### Minor Changes

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0-next.0
  - @shared/ui-info-state@0.5.0-next.0
  - @domain/entity-account-name@0.2.3-next.0
