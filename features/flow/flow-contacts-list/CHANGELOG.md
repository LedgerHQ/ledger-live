# @features/flow-contacts-list

## 0.11.0-next.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @features/platform-contacts@0.12.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/i18n@0.2.0

## 0.10.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23434](https://github.com/LedgerHQ/ledger-live/pull/23434) [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contacts list copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0
  - @domain/entity-contact@0.12.1

## 0.10.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23434](https://github.com/LedgerHQ/ledger-live/pull/23434) [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contacts list copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0-next.0
  - @domain/entity-contact@0.12.1-next.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0

## 0.9.0

### Minor Changes

- [#22447](https://github.com/LedgerHQ/ledger-live/pull/22447) [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the last contact hiding behind the Android system navigation bar by padding the mobile contacts list for the bottom safe area

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22240](https://github.com/LedgerHQ/ledger-live/pull/22240) [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show an empty-search state in Pay contact selection and dismiss the keyboard before opening a contact.

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @domain/entity-contact@0.11.0
  - @features/platform-contacts@0.9.0

## 0.9.0-next.2

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2

## 0.9.0-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.9.0-next.0

### Minor Changes

- [#22447](https://github.com/LedgerHQ/ledger-live/pull/22447) [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the last contact hiding behind the Android system navigation bar by padding the mobile contacts list for the bottom safe area

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22240](https://github.com/LedgerHQ/ledger-live/pull/22240) [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show an empty-search state in Pay contact selection and dismiss the keyboard before opening a contact.

### Patch Changes

- Updated dependencies [[`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @features/platform-contacts@0.9.0-next.0
  - @domain/entity-contact@0.10.1-next.0

## 0.8.0

### Minor Changes

- [#21923](https://github.com/LedgerHQ/ledger-live/pull/21923) [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E for creating, renaming and deleting a contact without an address (LIVE-35043).

- [#22067](https://github.com/LedgerHQ/ledger-live/pull/22067) [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contacts detail pane header shaking on address list scroll

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/platform-contacts@0.8.0
  - @domain/entity-contact@0.10.0

## 0.8.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.8.0-next.1

## 0.8.0-next.0

### Minor Changes

- [#21923](https://github.com/LedgerHQ/ledger-live/pull/21923) [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E for creating, renaming and deleting a contact without an address (LIVE-35043).

- [#22067](https://github.com/LedgerHQ/ledger-live/pull/22067) [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contacts detail pane header shaking on address list scroll

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/platform-contacts@0.8.0-next.0
  - @domain/entity-contact@0.10.0-next.0

## 0.7.0

### Minor Changes

- [#21584](https://github.com/LedgerHQ/ledger-live/pull/21584) [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts alphabetical index on Mobile not scrolling the list to the tapped or dragged letter. The index container now owns the gesture so touch coordinates resolve against it instead of against the tapped letter, which always resolved to the first section, and it keeps the responder instead of losing it to the list underneath on the first drag move. The list supplies `getItemLayout`, so `scrollToLocation` reaches sections below the render window instead of silently giving up on a long contact list. Dragging jumps without animating so a scrub no longer queues one cancelled scroll animation per letter.

- [#21920](https://github.com/LedgerHQ/ledger-live/pull/21920) [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141) Thanks [@ysitbon](https://github.com/ysitbon)! - Give each dual-platform feature package its own web and native TypeScript project

  These packages keep `.web.*` and `.native.*` sources side by side but typechecked both
  in a single program, so `tsc` resolved suffix-free imports without knowing which
  platform it was checking. Each package now carries a solution-style `tsconfig.json`
  that owns no files and references one project per platform it targets, as described in
  `docs/tsconfig-in-ddd.md`. The web project sets `moduleSuffixes: [".web", ""]` and
  excludes the native sources, the native project does the reverse and also excludes the
  unsuffixed web barrel, and `typecheck` runs both passes. `@features/flow-large-screen-upsell`
  is web-only and gets a web project on its own.

  Separating the two programs surfaced cross-platform leaks that a single program could
  not see, so this also fixes them. Barrels that hard-pinned one platform's file, in the
  Contacts button and the Market banner, now import suffix-free and let `moduleSuffixes`
  choose, which makes their parallel `index.native.ts` barrels redundant. The three
  packages whose web entry was `src/web.ts` now expose it as `src/index.ts`, so a native
  program resolving the package can find the `index.native.ts` beside it instead of
  falling through to the web barrel and dragging web components into the native program.
  `@features/platform-style` gives its web implementations the `.web` suffix they were
  missing, which stops its native program from typechecking web code against native
  components. One web test reached for `require`, which only resolved because React
  Native's global typings were leaking in from the native files sharing its program, and
  now imports normally.

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0
  - @domain/entity-contact@0.9.0

## 0.7.0-next.0

### Minor Changes

- [#21584](https://github.com/LedgerHQ/ledger-live/pull/21584) [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts alphabetical index on Mobile not scrolling the list to the tapped or dragged letter. The index container now owns the gesture so touch coordinates resolve against it instead of against the tapped letter, which always resolved to the first section, and it keeps the responder instead of losing it to the list underneath on the first drag move. The list supplies `getItemLayout`, so `scrollToLocation` reaches sections below the render window instead of silently giving up on a long contact list. Dragging jumps without animating so a scrub no longer queues one cancelled scroll animation per letter.

- [#21920](https://github.com/LedgerHQ/ledger-live/pull/21920) [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141) Thanks [@ysitbon](https://github.com/ysitbon)! - Give each dual-platform feature package its own web and native TypeScript project

  These packages keep `.web.*` and `.native.*` sources side by side but typechecked both
  in a single program, so `tsc` resolved suffix-free imports without knowing which
  platform it was checking. Each package now carries a solution-style `tsconfig.json`
  that owns no files and references one project per platform it targets, as described in
  `docs/tsconfig-in-ddd.md`. The web project sets `moduleSuffixes: [".web", ""]` and
  excludes the native sources, the native project does the reverse and also excludes the
  unsuffixed web barrel, and `typecheck` runs both passes. `@features/flow-large-screen-upsell`
  is web-only and gets a web project on its own.

  Separating the two programs surfaced cross-platform leaks that a single program could
  not see, so this also fixes them. Barrels that hard-pinned one platform's file, in the
  Contacts button and the Market banner, now import suffix-free and let `moduleSuffixes`
  choose, which makes their parallel `index.native.ts` barrels redundant. The three
  packages whose web entry was `src/web.ts` now expose it as `src/index.ts`, so a native
  program resolving the package can find the `index.native.ts` beside it instead of
  falling through to the web barrel and dragging web components into the native program.
  `@features/platform-style` gives its web implementations the `.web` suffix they were
  missing, which stops its native program from typechecking web code against native
  components. One web test reached for `require`, which only resolved because React
  Native's global typings were leaking in from the native files sharing its program, and
  now imports normally.

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0-next.0
  - @domain/entity-contact@0.9.0-next.0

## 0.6.0

### Minor Changes

- [#21606](https://github.com/LedgerHQ/ledger-live/pull/21606) [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix missing 8px spacing between items in the mobile contacts list

- [#21528](https://github.com/LedgerHQ/ledger-live/pull/21528) [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay New on a dedicated contact list, including people with no address.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0
  - @domain/entity-contact@0.8.2

## 0.6.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1

## 0.6.0-next.0

### Minor Changes

- [#21606](https://github.com/LedgerHQ/ledger-live/pull/21606) [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix missing 8px spacing between items in the mobile contacts list

- [#21528](https://github.com/LedgerHQ/ledger-live/pull/21528) [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay New on a dedicated contact list, including people with no address.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0-next.0
  - @domain/entity-contact@0.8.2-next.0

## 0.5.0

### Minor Changes

- [#21262](https://github.com/LedgerHQ/ledger-live/pull/21262) [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a) Thanks [@deepyjr](https://github.com/deepyjr)! - Compact the desktop contact detail header while scrolling addresses.

- [#21322](https://github.com/LedgerHQ/ledger-live/pull/21322) [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep consistent spacing after the last mobile contact.

- [#21242](https://github.com/LedgerHQ/ledger-live/pull/21242) [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add to an existing contact in send flow lwm

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @domain/entity-contact@0.8.1

## 0.5.0-next.0

### Minor Changes

- [#21262](https://github.com/LedgerHQ/ledger-live/pull/21262) [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a) Thanks [@deepyjr](https://github.com/deepyjr)! - Compact the desktop contact detail header while scrolling addresses.

- [#21322](https://github.com/LedgerHQ/ledger-live/pull/21322) [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep consistent spacing after the last mobile contact.

- [#21242](https://github.com/LedgerHQ/ledger-live/pull/21242) [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add to an existing contact in send flow lwm

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @domain/entity-contact@0.8.1-next.0

## 0.4.0

### Minor Changes

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20915](https://github.com/LedgerHQ/ledger-live/pull/20915) [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable compact contacts list for Desktop and Mobile

- [#20948](https://github.com/LedgerHQ/ledger-live/pull/20948) [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the web ContactAvatar import for compact contact lists

- [#20855](https://github.com/LedgerHQ/ledger-live/pull/20855) [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Lumen decorative palette for saved contact avatars on desktop.

- [#21013](https://github.com/LedgerHQ/ledger-live/pull/21013) [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd) Thanks [@deepyjr](https://github.com/deepyjr)! - Align the Contacts page with the wallet content area on Desktop.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0
  - @features/platform-contacts@0.4.0

## 0.4.0-next.0

### Minor Changes

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20915](https://github.com/LedgerHQ/ledger-live/pull/20915) [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable compact contacts list for Desktop and Mobile

- [#20948](https://github.com/LedgerHQ/ledger-live/pull/20948) [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the web ContactAvatar import for compact contact lists

- [#20855](https://github.com/LedgerHQ/ledger-live/pull/20855) [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Lumen decorative palette for saved contact avatars on desktop.

- [#21013](https://github.com/LedgerHQ/ledger-live/pull/21013) [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd) Thanks [@deepyjr](https://github.com/deepyjr)! - Align the Contacts page with the wallet content area on Desktop.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-contacts@0.4.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
