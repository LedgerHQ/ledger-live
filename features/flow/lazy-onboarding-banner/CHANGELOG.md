# @features/flow-lazy-onboarding-banner

## 0.4.0

### Minor Changes

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

## 0.4.0-next.0

### Minor Changes

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

## 0.3.0

### Minor Changes

- [#20589](https://github.com/LedgerHQ/ledger-live/pull/20589) [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Lazy Onboarding Tour drawer to the lazy onboarding banner, with updated banner/tour copy and imagery

## 0.3.0-next.0

### Minor Changes

- [#20589](https://github.com/LedgerHQ/ledger-live/pull/20589) [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Lazy Onboarding Tour drawer to the lazy onboarding banner, with updated banner/tour copy and imagery

## 0.2.0

### Minor Changes

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

## 0.2.0-next.0

### Minor Changes

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.
