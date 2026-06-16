# @ledgerhq/live-dmk-speculos

## 0.9.1

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0
  - @ledgerhq/hw-transport@6.35.4

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0-next.0
  - @ledgerhq/hw-transport@6.35.4-next.0

## 0.9.0

### Minor Changes

- [#17809](https://github.com/LedgerHQ/ledger-live/pull/17809) [`d61c27f`](https://github.com/LedgerHQ/ledger-live/commit/d61c27ffa89b7dc5d69278a38ebca3e9ea3aed6c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Repair the speculos e2e recording pipeline:

  - `live-dmk-speculos` now consumes the speculos `/events?stream=true` SSE feed and forwards events to `automationEvents`. The wiring had been silently dropped, so any scenario that drives on-device prompts (e.g. `pnpm lkrp e2e`) would stall waiting for button presses that never fired. The stream is opened lazily on first subscription and torn down when the last subscriber leaves, so APDU-only consumers (e.g. desktop e2e smoke tests) pay no socket cost. `automationEvents` is now an `Observable` rather than a `Subject` — existing `.subscribe()` / `.pipe()` consumers are unaffected.
  - `ledger-key-ring-protocol`'s e2e runner script switches its dynamic scenario loader from `await import()` to `createRequire` so Node 22+ resolves the `.ts` scenario files through the ts-node CJS hook instead of the native ESM resolver.

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0
  - @ledgerhq/hw-transport@6.35.3

## 0.9.0-next.0

### Minor Changes

- [#17809](https://github.com/LedgerHQ/ledger-live/pull/17809) [`d61c27f`](https://github.com/LedgerHQ/ledger-live/commit/d61c27ffa89b7dc5d69278a38ebca3e9ea3aed6c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Repair the speculos e2e recording pipeline:

  - `live-dmk-speculos` now consumes the speculos `/events?stream=true` SSE feed and forwards events to `automationEvents`. The wiring had been silently dropped, so any scenario that drives on-device prompts (e.g. `pnpm lkrp e2e`) would stall waiting for button presses that never fired. The stream is opened lazily on first subscription and torn down when the last subscriber leaves, so APDU-only consumers (e.g. desktop e2e smoke tests) pay no socket cost. `automationEvents` is now an `Observable` rather than a `Subject` — existing `.subscribe()` / `.pipe()` consumers are unaffected.
  - `ledger-key-ring-protocol`'s e2e runner script switches its dynamic scenario loader from `await import()` to `createRequire` so Node 22+ resolves the `.ts` scenario files through the ts-node CJS hook instead of the native ESM resolver.

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0-next.0
  - @ledgerhq/hw-transport@6.35.3-next.0

## 0.8.8

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0

## 0.8.8-next.0

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0-next.0

## 0.8.7

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0

## 0.8.7-next.0

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0-next.0

## 0.8.6

### Patch Changes

- Updated dependencies [[`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25)]:
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/hw-transport@6.35.2

## 0.8.6-next.0

### Patch Changes

- Updated dependencies [[`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25)]:
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 0.8.6

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.2

## 0.8.6-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.2-hotfix.0

## 0.8.5

### Patch Changes

- Updated dependencies [[`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440)]:
  - @ledgerhq/live-env@2.33.0
  - @ledgerhq/hw-transport@6.35.1

## 0.8.5-next.0

### Patch Changes

- Updated dependencies [[`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440)]:
  - @ledgerhq/live-env@2.33.0-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0

## 0.8.4

### Patch Changes

- Updated dependencies [[`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/live-env@2.32.0
  - @ledgerhq/hw-transport@6.35.0
  - @ledgerhq/logs@6.17.0

## 0.8.4-next.0

### Patch Changes

- Updated dependencies [[`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/live-env@2.32.0-next.0
  - @ledgerhq/hw-transport@6.35.0-next.0
  - @ledgerhq/logs@6.17.0-next.0

## 0.8.3

### Patch Changes

- Updated dependencies [[`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20)]:
  - @ledgerhq/live-env@2.31.0

## 0.8.3-next.0

### Patch Changes

- Updated dependencies [[`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20)]:
  - @ledgerhq/live-env@2.31.0-next.0

## 0.8.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.34.1

## 0.8.2-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.34.1-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d)]:
  - @ledgerhq/hw-transport@6.34.0
  - @ledgerhq/logs@6.16.0
  - @ledgerhq/live-env@2.30.0

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d)]:
  - @ledgerhq/hw-transport@6.34.0-next.0
  - @ledgerhq/logs@6.16.0-next.0
  - @ledgerhq/live-env@2.30.0-next.0

## 0.8.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/hw-transport@6.33.0
  - @ledgerhq/logs@6.15.0

## 0.8.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/hw-transport@6.33.0-next.0
  - @ledgerhq/logs@6.15.0-next.0

## 0.7.0

### Minor Changes

- [#14616](https://github.com/LedgerHQ/ledger-live/pull/14616) [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate to React 19.

### Patch Changes

- Updated dependencies [[`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d)]:
  - @ledgerhq/live-env@2.29.0

## 0.7.0-next.0

### Minor Changes

- [#14616](https://github.com/LedgerHQ/ledger-live/pull/14616) [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate to React 19.

### Patch Changes

- Updated dependencies [[`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d)]:
  - @ledgerhq/live-env@2.29.0-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0)]:
  - @ledgerhq/live-env@2.28.0

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0)]:
  - @ledgerhq/live-env@2.28.0-next.0

## 0.6.0

### Minor Changes

- [#14218](https://github.com/LedgerHQ/ledger-live/pull/14218) [`2407e23`](https://github.com/LedgerHQ/ledger-live/commit/2407e2350ca699b4b506bdfb1563ade32b022e0f) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Expose DMK context in renderer for E2E

## 0.6.0-next.0

### Minor Changes

- [#14218](https://github.com/LedgerHQ/ledger-live/pull/14218) [`2407e23`](https://github.com/LedgerHQ/ledger-live/commit/2407e2350ca699b4b506bdfb1563ade32b022e0f) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Expose DMK context in renderer for E2E

## 0.5.2

### Patch Changes

- Updated dependencies [[`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/live-env@2.27.0

## 0.5.2-next.0

### Patch Changes

- Updated dependencies [[`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/live-env@2.27.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a)]:
  - @ledgerhq/live-env@2.26.0

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a)]:
  - @ledgerhq/live-env@2.26.0-next.0

## 0.5.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59)]:
  - @ledgerhq/live-env@2.25.0
  - @ledgerhq/hw-transport@6.32.0
  - @ledgerhq/logs@6.14.0

## 0.5.0-next.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59)]:
  - @ledgerhq/live-env@2.25.0-next.0
  - @ledgerhq/hw-transport@6.32.0-next.0
  - @ledgerhq/logs@6.14.0-next.0

## 0.4.0

### Minor Changes

- [#13381](https://github.com/LedgerHQ/ledger-live/pull/13381) [`b394f1d`](https://github.com/LedgerHQ/ledger-live/commit/b394f1ddca998a384d5e8032899d7f9a356cc4cc) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Bump speculos version to remove duplications

### Patch Changes

- Updated dependencies [[`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea)]:
  - @ledgerhq/live-env@2.24.0
  - @ledgerhq/hw-transport@6.31.16

## 0.4.0-next.0

### Minor Changes

- [#13381](https://github.com/LedgerHQ/ledger-live/pull/13381) [`b394f1d`](https://github.com/LedgerHQ/ledger-live/commit/b394f1ddca998a384d5e8032899d7f9a356cc4cc) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Bump speculos version to remove duplications

### Patch Changes

- Updated dependencies [[`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea)]:
  - @ledgerhq/live-env@2.24.0-next.0
  - @ledgerhq/hw-transport@6.31.16-next.0

## 0.3.0

### Minor Changes

- [#13156](https://github.com/LedgerHQ/ledger-live/pull/13156) [`adbabc7`](https://github.com/LedgerHQ/ledger-live/commit/adbabc7d3b7ed8915503120a027d19304adc1fc8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - ws@8.18.3 in catalog

- [#13155](https://github.com/LedgerHQ/ledger-live/pull/13155) [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe) Thanks [@gre-ledger](https://github.com/gre-ledger)! - rxjs@7.8.2 everywhere

### Patch Changes

- Updated dependencies [[`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b)]:
  - @ledgerhq/live-env@2.23.0
  - @ledgerhq/hw-transport@6.31.15

## 0.3.0-next.0

### Minor Changes

- [#13156](https://github.com/LedgerHQ/ledger-live/pull/13156) [`adbabc7`](https://github.com/LedgerHQ/ledger-live/commit/adbabc7d3b7ed8915503120a027d19304adc1fc8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - ws@8.18.3 in catalog

- [#13155](https://github.com/LedgerHQ/ledger-live/pull/13155) [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe) Thanks [@gre-ledger](https://github.com/gre-ledger)! - rxjs@7.8.2 everywhere

### Patch Changes

- Updated dependencies [[`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b)]:
  - @ledgerhq/live-env@2.23.0-next.0
  - @ledgerhq/hw-transport@6.31.15-next.0

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.14

## 0.2.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.14-hotfix.0

## 0.2.0

### Minor Changes

- [#12563](https://github.com/LedgerHQ/ledger-live/pull/12563) [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add DMK speculos transport and device controller

### Patch Changes

- Updated dependencies [[`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045)]:
  - @ledgerhq/live-env@2.22.0

## 0.2.0-next.0

### Minor Changes

- [#12563](https://github.com/LedgerHQ/ledger-live/pull/12563) [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add DMK speculos transport and device controller

### Patch Changes

- Updated dependencies [[`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045)]:
  - @ledgerhq/live-env@2.22.0-next.0
