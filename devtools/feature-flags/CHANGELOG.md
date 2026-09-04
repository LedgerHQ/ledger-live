# @devtools/feature-flags

## 0.9.0-next.0

### Minor Changes

- [#21117](https://github.com/LedgerHQ/ledger-live/pull/21117) [`1190ce1`](https://github.com/LedgerHQ/ledger-live/commit/1190ce10656496de8af6aa893b6cafca6c8a36d8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Declares `expo-document-picker` as an optional peer dependency (and devDependency) in `@devtools/feature-flags`, removing it from regular dependencies. Adds it as a direct dependency in `ledger-live-mobile` so autolinking resolves correctly on the native side.

### Patch Changes

- Updated dependencies [[`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/feature-flags@0.21.0-next.0

## 0.8.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0

## 0.8.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @shared/feature-flags@0.19.0

## 0.7.1-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @shared/feature-flags@0.19.0-next.1

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @shared/feature-flags@0.19.0-next.0

## 0.7.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de)]:
  - @shared/feature-flags@0.18.0

## 0.7.0-next.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de)]:
  - @shared/feature-flags@0.18.0-next.0

## 0.6.4

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0

## 0.6.4-next.0

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0-next.0

## 0.6.3

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0

## 0.6.3-next.0

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @shared/feature-flags@0.15.0

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @shared/feature-flags@0.15.0-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0-next.0

## 0.6.0

### Minor Changes

- [#18820](https://github.com/LedgerHQ/ledger-live/pull/18820) [`f8d5212`](https://github.com/LedgerHQ/ledger-live/commit/f8d5212153829a32fcafc6fded768e5468251413) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add mobile ui

- [#19205](https://github.com/LedgerHQ/ledger-live/pull/19205) [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Prepare shell and components for LWD wiring. Add onClose to shell props and a back arrow in the sidebar. In feature-flags, replace the sidebar with a dialog.

- [#19147](https://github.com/LedgerHQ/ledger-live/pull/19147) [`5e081d3`](https://github.com/LedgerHQ/ledger-live/commit/5e081d349639537e0f3eb8536218a55f2f0ee241) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Remove unused parameters

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @shared/feature-flags@0.13.0

## 0.6.0-next.0

### Minor Changes

- [#18820](https://github.com/LedgerHQ/ledger-live/pull/18820) [`f8d5212`](https://github.com/LedgerHQ/ledger-live/commit/f8d5212153829a32fcafc6fded768e5468251413) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add mobile ui

- [#19205](https://github.com/LedgerHQ/ledger-live/pull/19205) [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Prepare shell and components for LWD wiring. Add onClose to shell props and a back arrow in the sidebar. In feature-flags, replace the sidebar with a dialog.

- [#19147](https://github.com/LedgerHQ/ledger-live/pull/19147) [`5e081d3`](https://github.com/LedgerHQ/ledger-live/commit/5e081d349639537e0f3eb8536218a55f2f0ee241) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Remove unused parameters

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @shared/feature-flags@0.13.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f), [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e), [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @shared/feature-flags@0.12.0

## 0.5.1-next.2

### Patch Changes

- Updated dependencies [[`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148)]:
  - @shared/feature-flags@0.12.0-next.2

## 0.5.1-next.1

### Patch Changes

- Updated dependencies [[`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e)]:
  - @shared/feature-flags@0.12.0-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
