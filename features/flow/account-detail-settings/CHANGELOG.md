# @features/flow-account-detail-settings

## 0.2.0-next.0

### Minor Changes

- [#23713](https://github.com/LedgerHQ/ledger-live/pull/23713) [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account settings (LWM bottom sheet, LWD dialog) show a **View in explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.

- [#23951](https://github.com/LedgerHQ/ledger-live/pull/23951) [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Confirming Remove account on desktop deletes the account and returns to the previous screen

- [#23965](https://github.com/LedgerHQ/ledger-live/pull/23965) [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f) Thanks [@ysitbon](https://github.com/ysitbon)! - `InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.

- [#23675](https://github.com/LedgerHQ/ledger-live/pull/23675) [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766) Thanks [@ysitbon](https://github.com/ysitbon)! - Reach `@shared/ui-info-state` through its universal entry only: the `./native` and `./web` subpaths, which repeated it, are gone, and their importers use `@shared/ui-info-state`. `@features/flow-account-detail-settings` renames its web entry to `src/index.web.ts`, so its native typecheck no longer compiles the web components.

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @shared/linking@0.4.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @domain/entity-account-name@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
  - @shared/clipboard@0.1.0
  - @shared/i18n@0.2.0

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
