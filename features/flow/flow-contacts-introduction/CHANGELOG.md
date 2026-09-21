# @features/flow-contacts-introduction

## 1.2.0

### Minor Changes

- [#21882](https://github.com/LedgerHQ/ledger-live/pull/21882) [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix bottom padding missing on the Ledger Sync intro modal in the Add Contact flow

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

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

## 1.2.0-next.0

### Minor Changes

- [#21882](https://github.com/LedgerHQ/ledger-live/pull/21882) [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix bottom padding missing on the Ledger Sync intro modal in the Add Contact flow

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

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

## 1.1.0

### Minor Changes

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21599](https://github.com/LedgerHQ/ledger-live/pull/21599) [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Pin the Contacts feature introduction CTA to the bottom of the mobile sheet

## 1.1.0-next.0

### Minor Changes

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21599](https://github.com/LedgerHQ/ledger-live/pull/21599) [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Pin the Contacts feature introduction CTA to the bottom of the mobile sheet

## 1.0.0

### Major Changes

- [#21348](https://github.com/LedgerHQ/ledger-live/pull/21348) [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8) Thanks [@deepyjr](https://github.com/deepyjr)! - Update the Contacts feature introduction image and English copy, and remove its description field from the shared contract.

## 1.0.0-next.0

### Major Changes

- [#21348](https://github.com/LedgerHQ/ledger-live/pull/21348) [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8) Thanks [@deepyjr](https://github.com/deepyjr)! - Update the Contacts feature introduction image and English copy, and remove its description field from the shared contract.

## 0.3.0

### Minor Changes

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

## 0.3.0-next.0

### Minor Changes

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

## 0.2.0

### Minor Changes

- [#20850](https://github.com/LedgerHQ/ledger-live/pull/20850) [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts feature introduction dialog width on desktop.

- [#20652](https://github.com/LedgerHQ/ledger-live/pull/20652) [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Feature and Ledger Sync introduction journeys into a dedicated flow package.

- [#20828](https://github.com/LedgerHQ/ledger-live/pull/20828) [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432) Thanks [@deepyjr](https://github.com/deepyjr)! - Remove the secondary action from the Contacts feature introduction.

## 0.2.0-next.0

### Minor Changes

- [#20850](https://github.com/LedgerHQ/ledger-live/pull/20850) [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts feature introduction dialog width on desktop.

- [#20652](https://github.com/LedgerHQ/ledger-live/pull/20652) [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Feature and Ledger Sync introduction journeys into a dedicated flow package.

- [#20828](https://github.com/LedgerHQ/ledger-live/pull/20828) [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432) Thanks [@deepyjr](https://github.com/deepyjr)! - Remove the secondary action from the Contacts feature introduction.
