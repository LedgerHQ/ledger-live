# @features/flow-contacts-edit-contact

## 0.5.0

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

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0
  - @domain/entity-contact@0.9.0

## 0.5.0-next.0

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

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0-next.0
  - @domain/entity-contact@0.9.0-next.0

## 0.4.0

### Minor Changes

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0
  - @domain/entity-contact@0.8.2

## 0.4.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1

## 0.4.0-next.0

### Minor Changes

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0-next.0
  - @domain/entity-contact@0.8.2-next.0

## 0.3.0

### Minor Changes

- [#21234](https://github.com/LedgerHQ/ledger-live/pull/21234) [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the keyboard flickering open and shut on the Mobile edit contact drawer, which focused its name field as soon as it mounted and so raised the keyboard into a drawer that was still animating. The field now waits for its drawer to settle before taking focus, as the add contact drawer already did, and focus is opt-in so no other drawer can raise the keyboard by accident.

  Also give the add contact, edit contact and Send add new contact drawers the same keyboard clearance as the add address and edit address drawers, so every contact drawer leaves the same gap above the keyboard on iOS instead of sitting flush against it.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @domain/entity-contact@0.8.1

## 0.3.0-next.0

### Minor Changes

- [#21234](https://github.com/LedgerHQ/ledger-live/pull/21234) [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the keyboard flickering open and shut on the Mobile edit contact drawer, which focused its name field as soon as it mounted and so raised the keyboard into a drawer that was still animating. The field now waits for its drawer to settle before taking focus, as the add contact drawer already did, and focus is opt-in so no other drawer can raise the keyboard by accident.

  Also give the add contact, edit contact and Send add new contact drawers the same keyboard clearance as the add address and edit address drawers, so every contact drawer leaves the same gap above the keyboard on iOS instead of sitting flush against it.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @domain/entity-contact@0.8.1-next.0

## 0.2.0

### Minor Changes

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0
  - @features/platform-contacts@0.4.0

## 0.2.0-next.0

### Minor Changes

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-contacts@0.4.0-next.0
