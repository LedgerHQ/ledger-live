# @ledgerhq/native-ui

## 0.56.0-next.0

### Minor Changes

- [#14303](https://github.com/LedgerHQ/ledger-live/pull/14303) [`7ac313c`](https://github.com/LedgerHQ/ledger-live/commit/7ac313c00fdfd6df29cc0767150f1ed0bbc380e2) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat: slides component

- [#14202](https://github.com/LedgerHQ/ledger-live/pull/14202) [`00c6ddd`](https://github.com/LedgerHQ/ledger-live/commit/00c6ddd11ebb925be63e651526f7bcfe50d0fda5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat: create Slides component

## 0.55.0

### Minor Changes

- [#13830](https://github.com/LedgerHQ/ledger-live/pull/13830) [`a90b9df`](https://github.com/LedgerHQ/ledger-live/commit/a90b9df5709ddcf0c1c7f6ceb31f0510b9888f7e) Thanks [@ysitbon](https://github.com/ysitbon)! - upgrade react-native-reanimated from v3 to v4

  - Add new required dependency `react-native-worklets` (0.7.2)
  - Migrate babel plugin from `react-native-reanimated/plugin` to `react-native-worklets/plugin`
  - Migrate `runOnJS` API to `scheduleOnRN` from `react-native-worklets`
  - Add missing dependency arrays to `useAnimatedStyle` hooks (required for Reanimated 4 without Babel plugin)
  - Update test mocks for compatibility with Reanimated 4

- [#14020](https://github.com/LedgerHQ/ledger-live/pull/14020) [`34cf993`](https://github.com/LedgerHQ/ledger-live/commit/34cf99398715d029c6d814cd9d4a697e5db775da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change network crypto icons border radius to match LWD

## 0.55.0-next.0

### Minor Changes

- [#13830](https://github.com/LedgerHQ/ledger-live/pull/13830) [`a90b9df`](https://github.com/LedgerHQ/ledger-live/commit/a90b9df5709ddcf0c1c7f6ceb31f0510b9888f7e) Thanks [@ysitbon](https://github.com/ysitbon)! - upgrade react-native-reanimated from v3 to v4

  - Add new required dependency `react-native-worklets` (0.7.2)
  - Migrate babel plugin from `react-native-reanimated/plugin` to `react-native-worklets/plugin`
  - Migrate `runOnJS` API to `scheduleOnRN` from `react-native-worklets`
  - Add missing dependency arrays to `useAnimatedStyle` hooks (required for Reanimated 4 without Babel plugin)
  - Update test mocks for compatibility with Reanimated 4

- [#14020](https://github.com/LedgerHQ/ledger-live/pull/14020) [`34cf993`](https://github.com/LedgerHQ/ledger-live/commit/34cf99398715d029c6d814cd9d4a697e5db775da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change network crypto icons border radius to match LWD

## 0.54.0

### Minor Changes

- [#13742](https://github.com/LedgerHQ/ledger-live/pull/13742) [`b8e22d3`](https://github.com/LedgerHQ/ledger-live/commit/b8e22d36b8bb44eda9dfd267227a22391519c08b) Thanks [@qperrot](https://github.com/qperrot)! - Fix: Suppress source map warnings for @celo/contractkit

- [#13556](https://github.com/LedgerHQ/ledger-live/pull/13556) [`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d) Thanks [@ysitbon](https://github.com/ysitbon)! - bump `react` to `19.0.0` and `react-native` to `0.79`

### Patch Changes

- Updated dependencies [[`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d)]:
  - @ledgerhq/icons-ui@0.19.0

## 0.54.0-next.0

### Minor Changes

- [#13742](https://github.com/LedgerHQ/ledger-live/pull/13742) [`b8e22d3`](https://github.com/LedgerHQ/ledger-live/commit/b8e22d36b8bb44eda9dfd267227a22391519c08b) Thanks [@qperrot](https://github.com/qperrot)! - Fix: Suppress source map warnings for @celo/contractkit

- [#13556](https://github.com/LedgerHQ/ledger-live/pull/13556) [`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d) Thanks [@ysitbon](https://github.com/ysitbon)! - bump `react` to `19.0.0` and `react-native` to `0.79`

### Patch Changes

- Updated dependencies [[`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d)]:
  - @ledgerhq/icons-ui@0.19.0-next.0

## 0.53.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

## 0.53.0-next.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

## 0.52.0

### Minor Changes

- [#13259](https://github.com/LedgerHQ/ledger-live/pull/13259) [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Bump styled-components to v6 on mobile and icons to prepare react 19 migration

- [#13306](https://github.com/LedgerHQ/ledger-live/pull/13306) [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add ledger sync step to llm two step sync companion

- [#13500](https://github.com/LedgerHQ/ledger-live/pull/13500) [`510d1be`](https://github.com/LedgerHQ/ledger-live/commit/510d1beba5c8ec0372eec5fabd1c02ab64693667) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update @babel/\* libraries and react-select

### Patch Changes

- Updated dependencies [[`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4)]:
  - @ledgerhq/icons-ui@0.18.0

## 0.52.0-next.0

### Minor Changes

- [#13259](https://github.com/LedgerHQ/ledger-live/pull/13259) [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Bump styled-components to v6 on mobile and icons to prepare react 19 migration

- [#13306](https://github.com/LedgerHQ/ledger-live/pull/13306) [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add ledger sync step to llm two step sync companion

- [#13500](https://github.com/LedgerHQ/ledger-live/pull/13500) [`510d1be`](https://github.com/LedgerHQ/ledger-live/commit/510d1beba5c8ec0372eec5fabd1c02ab64693667) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update @babel/\* libraries and react-select

### Patch Changes

- Updated dependencies [[`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4)]:
  - @ledgerhq/icons-ui@0.18.0-next.0

## 0.51.0

### Minor Changes

- [#13112](https://github.com/LedgerHQ/ledger-live/pull/13112) [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔧 Enforce @typescript-eslint/no-deprecated and Replace Deprecated APIs

- [#13038](https://github.com/LedgerHQ/ledger-live/pull/13038) [`ef276b7`](https://github.com/LedgerHQ/ledger-live/commit/ef276b7654ab32c7253ee812ceac3f89316ded4b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Uses crypto-icons everywhere and drop the legacy crypto-icons-ui for design unification and performance gain

- [#13165](https://github.com/LedgerHQ/ledger-live/pull/13165) [`1a89145`](https://github.com/LedgerHQ/ledger-live/commit/1a89145dad955ebb1909d1034a4f4daf794a4800) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove palette (deprecated) from styled-components/native & theme

- [#13142](https://github.com/LedgerHQ/ledger-live/pull/13142) [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - upgrade typescript-eslint rules & versions

## 0.51.0-next.0

### Minor Changes

- [#13112](https://github.com/LedgerHQ/ledger-live/pull/13112) [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔧 Enforce @typescript-eslint/no-deprecated and Replace Deprecated APIs

- [#13038](https://github.com/LedgerHQ/ledger-live/pull/13038) [`ef276b7`](https://github.com/LedgerHQ/ledger-live/commit/ef276b7654ab32c7253ee812ceac3f89316ded4b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Uses crypto-icons everywhere and drop the legacy crypto-icons-ui for design unification and performance gain

- [#13165](https://github.com/LedgerHQ/ledger-live/pull/13165) [`1a89145`](https://github.com/LedgerHQ/ledger-live/commit/1a89145dad955ebb1909d1034a4f4daf794a4800) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove palette (deprecated) from styled-components/native & theme

- [#13142](https://github.com/LedgerHQ/ledger-live/pull/13142) [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - upgrade typescript-eslint rules & versions

## 0.50.0

### Minor Changes

- [#12915](https://github.com/LedgerHQ/ledger-live/pull/12915) [`09c5ea4`](https://github.com/LedgerHQ/ledger-live/commit/09c5ea4a67c2b3f56deb13d0d3a828d6534e9477) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Use pressable and onPressIn for ledgersync flow

- [#11549](https://github.com/LedgerHQ/ledger-live/pull/11549) [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate to React-Native New-Architecture

### Patch Changes

- Updated dependencies [[`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`a3425cf`](https://github.com/LedgerHQ/ledger-live/commit/a3425cf0563667ac933765625e155f22db870ae1), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`1416051`](https://github.com/LedgerHQ/ledger-live/commit/141605179eeffc4d475150a3cfdeee431c21c7ee), [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856)]:
  - @ledgerhq/crypto-icons-ui@1.24.0
  - @ledgerhq/icons-ui@0.17.0

## 0.50.0-next.0

### Minor Changes

- [#12915](https://github.com/LedgerHQ/ledger-live/pull/12915) [`09c5ea4`](https://github.com/LedgerHQ/ledger-live/commit/09c5ea4a67c2b3f56deb13d0d3a828d6534e9477) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Use pressable and onPressIn for ledgersync flow

- [#11549](https://github.com/LedgerHQ/ledger-live/pull/11549) [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate to React-Native New-Architecture

### Patch Changes

- Updated dependencies [[`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`a3425cf`](https://github.com/LedgerHQ/ledger-live/commit/a3425cf0563667ac933765625e155f22db870ae1), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`1416051`](https://github.com/LedgerHQ/ledger-live/commit/141605179eeffc4d475150a3cfdeee431c21c7ee), [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856)]:
  - @ledgerhq/crypto-icons-ui@1.24.0-next.0
  - @ledgerhq/icons-ui@0.17.0-next.0

## 0.49.1

### Patch Changes

- Updated dependencies [[`42d9805`](https://github.com/LedgerHQ/ledger-live/commit/42d98050de48a1222bfca663dd4b8da7aafa3ee9)]:
  - @ledgerhq/crypto-icons-ui@1.23.0

## 0.49.1-next.0

### Patch Changes

- Updated dependencies [[`42d9805`](https://github.com/LedgerHQ/ledger-live/commit/42d98050de48a1222bfca663dd4b8da7aafa3ee9)]:
  - @ledgerhq/crypto-icons-ui@1.23.0-next.0

## 0.49.0

### Minor Changes

- [#12462](https://github.com/LedgerHQ/ledger-live/pull/12462) [`eeec50e`](https://github.com/LedgerHQ/ledger-live/commit/eeec50ea4e45b295cca51faa5ec2fc6ae5eca3d4) Thanks [@thesan](https://github.com/thesan)! - Rename Ledger Live Team to Ledger Wallet Team

- [#12351](https://github.com/LedgerHQ/ledger-live/pull/12351) [`396766d`](https://github.com/LedgerHQ/ledger-live/commit/396766dcc6ec5eef2c6502b0935ae21bc5873bf0) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - fix: styles of AnimatedNotchedLabel that cause GenericMemoTagInput to have a truncated input label

### Patch Changes

- Updated dependencies [[`b600bb7`](https://github.com/LedgerHQ/ledger-live/commit/b600bb70c65f5e151ad22a7d2b485363aa8eaea3), [`eeec50e`](https://github.com/LedgerHQ/ledger-live/commit/eeec50ea4e45b295cca51faa5ec2fc6ae5eca3d4), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`da727d3`](https://github.com/LedgerHQ/ledger-live/commit/da727d355b6911699cccb16bae6b0c7e9e2bea95), [`62f3021`](https://github.com/LedgerHQ/ledger-live/commit/62f3021603bbfda619ca0c4dcd72a2f61874c5d6), [`c1a4bfd`](https://github.com/LedgerHQ/ledger-live/commit/c1a4bfd34b46c6b6587d247673cadb3c078deb1d)]:
  - @ledgerhq/crypto-icons-ui@1.22.0
  - @ledgerhq/ui-shared@0.5.0
  - @ledgerhq/icons-ui@0.16.0

## 0.49.0-next.0

### Minor Changes

- [#12462](https://github.com/LedgerHQ/ledger-live/pull/12462) [`eeec50e`](https://github.com/LedgerHQ/ledger-live/commit/eeec50ea4e45b295cca51faa5ec2fc6ae5eca3d4) Thanks [@thesan](https://github.com/thesan)! - Rename Ledger Live Team to Ledger Wallet Team

- [#12351](https://github.com/LedgerHQ/ledger-live/pull/12351) [`396766d`](https://github.com/LedgerHQ/ledger-live/commit/396766dcc6ec5eef2c6502b0935ae21bc5873bf0) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - fix: styles of AnimatedNotchedLabel that cause GenericMemoTagInput to have a truncated input label

### Patch Changes

- Updated dependencies [[`b600bb7`](https://github.com/LedgerHQ/ledger-live/commit/b600bb70c65f5e151ad22a7d2b485363aa8eaea3), [`eeec50e`](https://github.com/LedgerHQ/ledger-live/commit/eeec50ea4e45b295cca51faa5ec2fc6ae5eca3d4), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`da727d3`](https://github.com/LedgerHQ/ledger-live/commit/da727d355b6911699cccb16bae6b0c7e9e2bea95), [`62f3021`](https://github.com/LedgerHQ/ledger-live/commit/62f3021603bbfda619ca0c4dcd72a2f61874c5d6), [`c1a4bfd`](https://github.com/LedgerHQ/ledger-live/commit/c1a4bfd34b46c6b6587d247673cadb3c078deb1d)]:
  - @ledgerhq/crypto-icons-ui@1.22.0-next.0
  - @ledgerhq/ui-shared@0.5.0-next.0
  - @ledgerhq/icons-ui@0.16.0-next.0

## 0.48.0

### Minor Changes

- [#12126](https://github.com/LedgerHQ/ledger-live/pull/12126) [`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - use pnpm catalog for react & react-dom

- [#12065](https://github.com/LedgerHQ/ledger-live/pull/12065) [`2a894ed`](https://github.com/LedgerHQ/ledger-live/commit/2a894ed2ba5300758cf1647921b00e1be0d469a7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - : replace defaultProps with default parameters

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202)]:
  - @ledgerhq/crypto-icons-ui@1.21.0
  - @ledgerhq/icons-ui@0.15.0

## 0.48.0-next.0

### Minor Changes

- [#12126](https://github.com/LedgerHQ/ledger-live/pull/12126) [`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - use pnpm catalog for react & react-dom

- [#12065](https://github.com/LedgerHQ/ledger-live/pull/12065) [`2a894ed`](https://github.com/LedgerHQ/ledger-live/commit/2a894ed2ba5300758cf1647921b00e1be0d469a7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - : replace defaultProps with default parameters

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202)]:
  - @ledgerhq/crypto-icons-ui@1.21.0-next.0
  - @ledgerhq/icons-ui@0.15.0-next.0

## 0.47.0

### Minor Changes

- [#11933](https://github.com/LedgerHQ/ledger-live/pull/11933) [`bb25ec4`](https://github.com/LedgerHQ/ledger-live/commit/bb25ec472bf24e308ae062a75fda8672c7dac596) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix android crash caused by unexpected string style property

### Patch Changes

- Updated dependencies [[`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed)]:
  - @ledgerhq/crypto-icons-ui@1.20.0

## 0.47.0-next.0

### Minor Changes

- [#11933](https://github.com/LedgerHQ/ledger-live/pull/11933) [`bb25ec4`](https://github.com/LedgerHQ/ledger-live/commit/bb25ec472bf24e308ae062a75fda8672c7dac596) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix android crash caused by unexpected string style property

### Patch Changes

- Updated dependencies [[`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed)]:
  - @ledgerhq/crypto-icons-ui@1.20.0-next.0

## 0.46.0

### Minor Changes

- [#11829](https://github.com/LedgerHQ/ledger-live/pull/11829) [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Implement marketTrend modular parameters for the left and right elements of the mad assets page

- [#11807](https://github.com/LedgerHQ/ledger-live/pull/11807) [`cd77268`](https://github.com/LedgerHQ/ledger-live/commit/cd77268985adab566c797ac854ad993cbb43972f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - MAD - LLM - CryptoIcons add param to be have responsive background behind network icon

- [#11874](https://github.com/LedgerHQ/ledger-live/pull/11874) [`10124f6`](https://github.com/LedgerHQ/ledger-live/commit/10124f6519157b2250e452966c16f67aad40204e) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add neutral last step to native vertical timeline component

### Patch Changes

- Updated dependencies [[`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`12909c4`](https://github.com/LedgerHQ/ledger-live/commit/12909c464d22e72d741262df106d0b3ce7f9130a), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`aade218`](https://github.com/LedgerHQ/ledger-live/commit/aade21864a36bce4b81dcce7ae46fe73894f9d33)]:
  - @ledgerhq/crypto-icons-ui@1.19.0
  - @ledgerhq/icons-ui@0.14.0

## 0.46.0-next.0

### Minor Changes

- [#11829](https://github.com/LedgerHQ/ledger-live/pull/11829) [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Implement marketTrend modular parameters for the left and right elements of the mad assets page

- [#11807](https://github.com/LedgerHQ/ledger-live/pull/11807) [`cd77268`](https://github.com/LedgerHQ/ledger-live/commit/cd77268985adab566c797ac854ad993cbb43972f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - MAD - LLM - CryptoIcons add param to be have responsive background behind network icon

- [#11874](https://github.com/LedgerHQ/ledger-live/pull/11874) [`10124f6`](https://github.com/LedgerHQ/ledger-live/commit/10124f6519157b2250e452966c16f67aad40204e) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add neutral last step to native vertical timeline component

### Patch Changes

- Updated dependencies [[`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`12909c4`](https://github.com/LedgerHQ/ledger-live/commit/12909c464d22e72d741262df106d0b3ce7f9130a), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`aade218`](https://github.com/LedgerHQ/ledger-live/commit/aade21864a36bce4b81dcce7ae46fe73894f9d33)]:
  - @ledgerhq/crypto-icons-ui@1.19.0-next.0
  - @ledgerhq/icons-ui@0.14.0-next.0

## 0.45.0

### Minor Changes

- [#11556](https://github.com/LedgerHQ/ledger-live/pull/11556) [`5040e5c`](https://github.com/LedgerHQ/ledger-live/commit/5040e5c986517a958702639b577a9e6bc90d9dfc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LargeMover fix PriceVariation indicator and ProgressPoint

### Patch Changes

- Updated dependencies [[`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620)]:
  - @ledgerhq/ui-shared@0.4.0

## 0.45.0-next.0

### Minor Changes

- [#11556](https://github.com/LedgerHQ/ledger-live/pull/11556) [`5040e5c`](https://github.com/LedgerHQ/ledger-live/commit/5040e5c986517a958702639b577a9e6bc90d9dfc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LargeMover fix PriceVariation indicator and ProgressPoint

### Patch Changes

- Updated dependencies [[`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620)]:
  - @ledgerhq/ui-shared@0.4.0-next.0

## 0.44.0

### Minor Changes

- [#11493](https://github.com/LedgerHQ/ledger-live/pull/11493) [`d4c4029`](https://github.com/LedgerHQ/ledger-live/commit/d4c40293a4f5d70f2d6819532b51dff2a9d75809) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add APYIndicator component for LLM to native-ui lib. Move from LLD to react-ui the APYIndicator to be iso

### Patch Changes

- Updated dependencies [[`7e4ac62`](https://github.com/LedgerHQ/ledger-live/commit/7e4ac62bd383f96e5649b225e0ff824fe7663695)]:
  - @ledgerhq/crypto-icons-ui@1.18.0

## 0.44.0-next.0

### Minor Changes

- [#11493](https://github.com/LedgerHQ/ledger-live/pull/11493) [`d4c4029`](https://github.com/LedgerHQ/ledger-live/commit/d4c40293a4f5d70f2d6819532b51dff2a9d75809) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add APYIndicator component for LLM to native-ui lib. Move from LLD to react-ui the APYIndicator to be iso

### Patch Changes

- Updated dependencies [[`7e4ac62`](https://github.com/LedgerHQ/ledger-live/commit/7e4ac62bd383f96e5649b225e0ff824fe7663695)]:
  - @ledgerhq/crypto-icons-ui@1.18.0-next.0

## 0.43.0

### Minor Changes

- [#11188](https://github.com/LedgerHQ/ledger-live/pull/11188) [`ec0cb33`](https://github.com/LedgerHQ/ledger-live/commit/ec0cb3389d56830fda440cf8bbbb5e98424960aa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump crypto icons, fix reanimated jest support, enhance MAD Drawer animation

- [#11153](https://github.com/LedgerHQ/ledger-live/pull/11153) [`df9c266`](https://github.com/LedgerHQ/ledger-live/commit/df9c2667ca638d4ba52c469737566f7ce6b08e08) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD AccountItem, AccountList, AccountSelection

### Patch Changes

- Updated dependencies [[`96654b0`](https://github.com/LedgerHQ/ledger-live/commit/96654b01611519901cb1957213c154f8bcda599c)]:
  - @ledgerhq/crypto-icons-ui@1.17.0

## 0.43.0-next.0

### Minor Changes

- [#11188](https://github.com/LedgerHQ/ledger-live/pull/11188) [`ec0cb33`](https://github.com/LedgerHQ/ledger-live/commit/ec0cb3389d56830fda440cf8bbbb5e98424960aa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump crypto icons, fix reanimated jest support, enhance MAD Drawer animation

- [#11153](https://github.com/LedgerHQ/ledger-live/pull/11153) [`df9c266`](https://github.com/LedgerHQ/ledger-live/commit/df9c2667ca638d4ba52c469737566f7ce6b08e08) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD AccountItem, AccountList, AccountSelection

### Patch Changes

- Updated dependencies [[`96654b0`](https://github.com/LedgerHQ/ledger-live/commit/96654b01611519901cb1957213c154f8bcda599c)]:
  - @ledgerhq/crypto-icons-ui@1.17.0-next.0

## 0.42.0

### Minor Changes

- [#11064](https://github.com/LedgerHQ/ledger-live/pull/11064) [`8ec356e`](https://github.com/LedgerHQ/ledger-live/commit/8ec356efa497953c99e3591df001a68200889718) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add new drawer library, add MAD animations and fix some UI issues

- [#11055](https://github.com/LedgerHQ/ledger-live/pull/11055) [`6612a57`](https://github.com/LedgerHQ/ledger-live/commit/6612a57f47fa25e43fb933e5eec523069aa86a70) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD Analytics

## 0.42.0-next.0

### Minor Changes

- [#11064](https://github.com/LedgerHQ/ledger-live/pull/11064) [`8ec356e`](https://github.com/LedgerHQ/ledger-live/commit/8ec356efa497953c99e3591df001a68200889718) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add new drawer library, add MAD animations and fix some UI issues

- [#11055](https://github.com/LedgerHQ/ledger-live/pull/11055) [`6612a57`](https://github.com/LedgerHQ/ledger-live/commit/6612a57f47fa25e43fb933e5eec523069aa86a70) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD Analytics

## 0.41.0

### Minor Changes

- [#11046](https://github.com/LedgerHQ/ledger-live/pull/11046) [`820b163`](https://github.com/LedgerHQ/ledger-live/commit/820b16316a9b0a87bb1157617c96ae7b1d6ca1d2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix colors for dark & light mode using pre-ldls

## 0.41.0-next.0

### Minor Changes

- [#11046](https://github.com/LedgerHQ/ledger-live/pull/11046) [`820b163`](https://github.com/LedgerHQ/ledger-live/commit/820b16316a9b0a87bb1157617c96ae7b1d6ca1d2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix colors for dark & light mode using pre-ldls

## 0.40.0

### Minor Changes

- [#10858](https://github.com/LedgerHQ/ledger-live/pull/10858) [`7883393`](https://github.com/LedgerHQ/ledger-live/commit/788339359ad9b7fafbf74c0788b1e2d8f7e3bc19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD NetworkList Component

- [#10835](https://github.com/LedgerHQ/ledger-live/pull/10835) [`782b9ae`](https://github.com/LedgerHQ/ledger-live/commit/782b9aef66d9f5a4450f5f2bb1f06b53373ae115) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Add AssetList component in LLM ldls

- [#10950](https://github.com/LedgerHQ/ledger-live/pull/10950) [`084676a`](https://github.com/LedgerHQ/ledger-live/commit/084676a26857cbbcecb38a6543a1816c7601dde1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add search Input to LLM ui pre ldls

- [#10909](https://github.com/LedgerHQ/ledger-live/pull/10909) [`9d55265`](https://github.com/LedgerHQ/ledger-live/commit/9d55265f75fa7d1b27b51a83d5ec74484b6b7fd5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - MAD - LLM - Bump crypto icons package -- Use flatlist instead of flashlist inside the ui lib -- Display select asset list and select account list -- Add search placeholder and logic

### Patch Changes

- Updated dependencies [[`07ec46c`](https://github.com/LedgerHQ/ledger-live/commit/07ec46c5b46829f2660ed8bb35e75376796f1756)]:
  - @ledgerhq/icons-ui@0.13.0

## 0.40.0-next.0

### Minor Changes

- [#10858](https://github.com/LedgerHQ/ledger-live/pull/10858) [`7883393`](https://github.com/LedgerHQ/ledger-live/commit/788339359ad9b7fafbf74c0788b1e2d8f7e3bc19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: LLM MAD NetworkList Component

- [#10835](https://github.com/LedgerHQ/ledger-live/pull/10835) [`782b9ae`](https://github.com/LedgerHQ/ledger-live/commit/782b9aef66d9f5a4450f5f2bb1f06b53373ae115) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Add AssetList component in LLM ldls

- [#10950](https://github.com/LedgerHQ/ledger-live/pull/10950) [`084676a`](https://github.com/LedgerHQ/ledger-live/commit/084676a26857cbbcecb38a6543a1816c7601dde1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add search Input to LLM ui pre ldls

- [#10909](https://github.com/LedgerHQ/ledger-live/pull/10909) [`9d55265`](https://github.com/LedgerHQ/ledger-live/commit/9d55265f75fa7d1b27b51a83d5ec74484b6b7fd5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - MAD - LLM - Bump crypto icons package -- Use flatlist instead of flashlist inside the ui lib -- Display select asset list and select account list -- Add search placeholder and logic

### Patch Changes

- Updated dependencies [[`07ec46c`](https://github.com/LedgerHQ/ledger-live/commit/07ec46c5b46829f2660ed8bb35e75376796f1756)]:
  - @ledgerhq/icons-ui@0.13.0-next.0

## 0.39.0

### Minor Changes

- [#10698](https://github.com/LedgerHQ/ledger-live/pull/10698) [`d1fb0d5`](https://github.com/LedgerHQ/ledger-live/commit/d1fb0d5c598ba0f6cad04624ff61f65364fa1784) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: add cryptoIcon in storybook native pre-ldls

### Patch Changes

- Updated dependencies [[`061f626`](https://github.com/LedgerHQ/ledger-live/commit/061f6268cbbf0f56d90cd2d117b714fe8559d271)]:
  - @ledgerhq/crypto-icons-ui@1.16.0

## 0.39.0-next.0

### Minor Changes

- [#10698](https://github.com/LedgerHQ/ledger-live/pull/10698) [`d1fb0d5`](https://github.com/LedgerHQ/ledger-live/commit/d1fb0d5c598ba0f6cad04624ff61f65364fa1784) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: add cryptoIcon in storybook native pre-ldls

### Patch Changes

- Updated dependencies [[`061f626`](https://github.com/LedgerHQ/ledger-live/commit/061f6268cbbf0f56d90cd2d117b714fe8559d271)]:
  - @ledgerhq/crypto-icons-ui@1.16.0-next.0

## 0.38.0

### Minor Changes

- [#10722](https://github.com/LedgerHQ/ledger-live/pull/10722) [`7291131`](https://github.com/LedgerHQ/ledger-live/commit/7291131523cc620aa81553260430d890b02bf3bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - MAD - Navigation header

## 0.38.0-next.0

### Minor Changes

- [#10722](https://github.com/LedgerHQ/ledger-live/pull/10722) [`7291131`](https://github.com/LedgerHQ/ledger-live/commit/7291131523cc620aa81553260430d890b02bf3bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - MAD - Navigation header

## 0.37.0

### Minor Changes

- [#10590](https://github.com/LedgerHQ/ledger-live/pull/10590) [`752fc6b`](https://github.com/LedgerHQ/ledger-live/commit/752fc6b72fac537563bc6d21b45ce412875f6b7b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade Storybook React native to v7

- [#10591](https://github.com/LedgerHQ/ledger-live/pull/10591) [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add ledger charon support

### Patch Changes

- Updated dependencies [[`efdcdc1`](https://github.com/LedgerHQ/ledger-live/commit/efdcdc14d395a31670d94bd32f301e10794a70d8)]:
  - @ledgerhq/icons-ui@0.12.0

## 0.37.0-next.0

### Minor Changes

- [#10590](https://github.com/LedgerHQ/ledger-live/pull/10590) [`752fc6b`](https://github.com/LedgerHQ/ledger-live/commit/752fc6b72fac537563bc6d21b45ce412875f6b7b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade Storybook React native to v7

- [#10591](https://github.com/LedgerHQ/ledger-live/pull/10591) [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add ledger charon support

### Patch Changes

- Updated dependencies [[`efdcdc1`](https://github.com/LedgerHQ/ledger-live/commit/efdcdc14d395a31670d94bd32f301e10794a70d8)]:
  - @ledgerhq/icons-ui@0.12.0-next.0

## 0.36.0

### Minor Changes

- [#10229](https://github.com/LedgerHQ/ledger-live/pull/10229) [`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade React Native from 0.75 to 0.77

### Patch Changes

- Updated dependencies [[`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246)]:
  - @ledgerhq/crypto-icons-ui@1.15.0
  - @ledgerhq/icons-ui@0.11.0

## 0.36.0-next.0

### Minor Changes

- [#10229](https://github.com/LedgerHQ/ledger-live/pull/10229) [`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade React Native from 0.75 to 0.77

### Patch Changes

- Updated dependencies [[`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246)]:
  - @ledgerhq/crypto-icons-ui@1.15.0-next.0
  - @ledgerhq/icons-ui@0.11.0-next.0

## 0.35.0

### Minor Changes

- [#10352](https://github.com/LedgerHQ/ledger-live/pull/10352) [`e604a8b`](https://github.com/LedgerHQ/ledger-live/commit/e604a8b0839d7a5dd4e137092605ea3c253fea49) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: P1 bugs on Large Mover

- [#10328](https://github.com/LedgerHQ/ledger-live/pull/10328) [`ff0a516`](https://github.com/LedgerHQ/ledger-live/commit/ff0a516c54ac1bed9d0da70d2531b7f535afad2e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: card scollable and buttons clickable on android

## 0.35.0-next.0

### Minor Changes

- [#10352](https://github.com/LedgerHQ/ledger-live/pull/10352) [`e604a8b`](https://github.com/LedgerHQ/ledger-live/commit/e604a8b0839d7a5dd4e137092605ea3c253fea49) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: P1 bugs on Large Mover

- [#10328](https://github.com/LedgerHQ/ledger-live/pull/10328) [`ff0a516`](https://github.com/LedgerHQ/ledger-live/commit/ff0a516c54ac1bed9d0da70d2531b7f535afad2e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: card scollable and buttons clickable on android

## 0.34.1

### Patch Changes

- Updated dependencies [[`0c268fb`](https://github.com/LedgerHQ/ledger-live/commit/0c268fbc9d08f98b2b383fde36d77e92b5953675)]:
  - @ledgerhq/crypto-icons-ui@1.14.0

## 0.34.1-next.0

### Patch Changes

- Updated dependencies [[`0c268fb`](https://github.com/LedgerHQ/ledger-live/commit/0c268fbc9d08f98b2b383fde36d77e92b5953675)]:
  - @ledgerhq/crypto-icons-ui@1.14.0-next.0

## 0.34.0

### Minor Changes

- [#10071](https://github.com/LedgerHQ/ledger-live/pull/10071) [`2ff4c03`](https://github.com/LedgerHQ/ledger-live/commit/2ff4c03ca7d8232563141b9531b1359087e57c59) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Generic Card for Large Mover

## 0.34.0-next.0

### Minor Changes

- [#10071](https://github.com/LedgerHQ/ledger-live/pull/10071) [`2ff4c03`](https://github.com/LedgerHQ/ledger-live/commit/2ff4c03ca7d8232563141b9531b1359087e57c59) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Generic Card for Large Mover

## 0.33.1

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`a4b6b29`](https://github.com/LedgerHQ/ledger-live/commit/a4b6b29df7ef74129345278cf07942619b36435b)]:
  - @ledgerhq/crypto-icons-ui@1.13.0
  - @ledgerhq/icons-ui@0.10.0

## 0.33.1-next.0

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`a4b6b29`](https://github.com/LedgerHQ/ledger-live/commit/a4b6b29df7ef74129345278cf07942619b36435b)]:
  - @ledgerhq/crypto-icons-ui@1.13.0-next.0
  - @ledgerhq/icons-ui@0.10.0-next.0

## 0.33.0

### Minor Changes

- [#9870](https://github.com/LedgerHQ/ledger-live/pull/9870) [`088b402`](https://github.com/LedgerHQ/ledger-live/commit/088b4025b6244565e581a61129854d294befc6c6) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Feat: Large Mover TimeFrame Component

- [#9950](https://github.com/LedgerHQ/ledger-live/pull/9950) [`7d28d6d`](https://github.com/LedgerHQ/ledger-live/commit/7d28d6d7dbf5cbc2aad1ae46c8c4e5f226971384) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Large Mover Footer Component

## 0.33.0-next.0

### Minor Changes

- [#9870](https://github.com/LedgerHQ/ledger-live/pull/9870) [`088b402`](https://github.com/LedgerHQ/ledger-live/commit/088b4025b6244565e581a61129854d294befc6c6) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Feat: Large Mover TimeFrame Component

- [#9950](https://github.com/LedgerHQ/ledger-live/pull/9950) [`7d28d6d`](https://github.com/LedgerHQ/ledger-live/commit/7d28d6d7dbf5cbc2aad1ae46c8c4e5f226971384) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: Large Mover Footer Component

## 0.32.0

### Minor Changes

- [#9889](https://github.com/LedgerHQ/ledger-live/pull/9889) [`8b417e4`](https://github.com/LedgerHQ/ledger-live/commit/8b417e453bc28395b88864faee37c8839ee49bc8) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Feat: Large Mover Performance Component

### Patch Changes

- Updated dependencies [[`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/crypto-icons-ui@1.12.0

## 0.32.0-next.0

### Minor Changes

- [#9889](https://github.com/LedgerHQ/ledger-live/pull/9889) [`8b417e4`](https://github.com/LedgerHQ/ledger-live/commit/8b417e453bc28395b88864faee37c8839ee49bc8) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Feat: Large Mover Performance Component

### Patch Changes

- Updated dependencies [[`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/crypto-icons-ui@1.12.0-next.0

## 0.31.1

### Patch Changes

- Updated dependencies [[`eea82e7`](https://github.com/LedgerHQ/ledger-live/commit/eea82e7993c27eacdbaba2f5418df64c75db3f2d), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/icons-ui@0.9.0
  - @ledgerhq/crypto-icons-ui@1.11.0

## 0.31.1-next.0

### Patch Changes

- Updated dependencies [[`eea82e7`](https://github.com/LedgerHQ/ledger-live/commit/eea82e7993c27eacdbaba2f5418df64c75db3f2d), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/icons-ui@0.9.0-next.0
  - @ledgerhq/crypto-icons-ui@1.11.0-next.0

## 0.31.0

### Minor Changes

- [#9505](https://github.com/LedgerHQ/ledger-live/pull/9505) [`be1b3ad`](https://github.com/LedgerHQ/ledger-live/commit/be1b3ad53fa400d24165873e9b0103a8c3063e39) Thanks [@thesan](https://github.com/thesan)! - Add the banner component to use for the LNS upsell campaign

- [#9506](https://github.com/LedgerHQ/ledger-live/pull/9506) [`4599711`](https://github.com/LedgerHQ/ledger-live/commit/459971108e07785b4eabecca4d2185d50ddecc58) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Bigger line height to display thai properly

## 0.31.0-next.0

### Minor Changes

- [#9505](https://github.com/LedgerHQ/ledger-live/pull/9505) [`be1b3ad`](https://github.com/LedgerHQ/ledger-live/commit/be1b3ad53fa400d24165873e9b0103a8c3063e39) Thanks [@thesan](https://github.com/thesan)! - Add the banner component to use for the LNS upsell campaign

- [#9506](https://github.com/LedgerHQ/ledger-live/pull/9506) [`4599711`](https://github.com/LedgerHQ/ledger-live/commit/459971108e07785b4eabecca4d2185d50ddecc58) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Bigger line height to display thai properly

## 0.30.0

### Minor Changes

- [#9477](https://github.com/LedgerHQ/ledger-live/pull/9477) [`a9bc76f`](https://github.com/LedgerHQ/ledger-live/commit/a9bc76f64ce80ed60b943f1daaa088fd410f856c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fix Thai high prio UI issues

### Patch Changes

- Updated dependencies [[`3ed81b0`](https://github.com/LedgerHQ/ledger-live/commit/3ed81b059f9d8755b58a966bd6647dd34a840378)]:
  - @ledgerhq/crypto-icons-ui@1.10.0

## 0.30.0-next.0

### Minor Changes

- [#9477](https://github.com/LedgerHQ/ledger-live/pull/9477) [`a9bc76f`](https://github.com/LedgerHQ/ledger-live/commit/a9bc76f64ce80ed60b943f1daaa088fd410f856c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fix Thai high prio UI issues

### Patch Changes

- Updated dependencies [[`3ed81b0`](https://github.com/LedgerHQ/ledger-live/commit/3ed81b059f9d8755b58a966bd6647dd34a840378)]:
  - @ledgerhq/crypto-icons-ui@1.10.0-next.0

## 0.29.1

### Patch Changes

- Updated dependencies [[`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331)]:
  - @ledgerhq/crypto-icons-ui@1.9.0

## 0.29.1-next.0

### Patch Changes

- Updated dependencies [[`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331)]:
  - @ledgerhq/crypto-icons-ui@1.9.0-next.0

## 0.29.0

### Minor Changes

- [#9135](https://github.com/LedgerHQ/ledger-live/pull/9135) [`653356d`](https://github.com/LedgerHQ/ledger-live/commit/653356d8a4205069a17e41ce9f0212749d35afdd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Force the initial tab to display for tabSelector. Store the value of the last tab for portfolioAssets accountsList

## 0.29.0-next.0

### Minor Changes

- [#9135](https://github.com/LedgerHQ/ledger-live/pull/9135) [`653356d`](https://github.com/LedgerHQ/ledger-live/commit/653356d8a4205069a17e41ce9f0212749d35afdd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Force the initial tab to display for tabSelector. Store the value of the last tab for portfolioAssets accountsList

## 0.28.0

### Minor Changes

- [#8962](https://github.com/LedgerHQ/ledger-live/pull/8962) [`4958893`](https://github.com/LedgerHQ/ledger-live/commit/49588934da0f23c668d4244999d0c1842cf4a632) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix tab selector to use a key instead of a string

## 0.28.0-next.0

### Minor Changes

- [#8962](https://github.com/LedgerHQ/ledger-live/pull/8962) [`4958893`](https://github.com/LedgerHQ/ledger-live/commit/49588934da0f23c668d4244999d0c1842cf4a632) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix tab selector to use a key instead of a string

## 0.27.1

### Patch Changes

- Updated dependencies [[`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/crypto-icons-ui@1.8.0

## 0.27.1-next.0

### Patch Changes

- Updated dependencies [[`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/crypto-icons-ui@1.8.0-next.0

## 0.27.0

### Minor Changes

- [#8663](https://github.com/LedgerHQ/ledger-live/pull/8663) [`8223e21`](https://github.com/LedgerHQ/ledger-live/commit/8223e21e5828a7735daf0a6684c1e4cab9dec892) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Create a new tabSelector component inside native ui. Rename the existing one in DrawerTabSelector since it's used only in a drawer. Integration of the new assets/accounts lists in wallet screen

### Patch Changes

- Updated dependencies [[`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1)]:
  - @ledgerhq/crypto-icons-ui@1.7.0

## 0.27.0-next.0

### Minor Changes

- [#8663](https://github.com/LedgerHQ/ledger-live/pull/8663) [`8223e21`](https://github.com/LedgerHQ/ledger-live/commit/8223e21e5828a7735daf0a6684c1e4cab9dec892) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Create a new tabSelector component inside native ui. Rename the existing one in DrawerTabSelector since it's used only in a drawer. Integration of the new assets/accounts lists in wallet screen

### Patch Changes

- Updated dependencies [[`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1)]:
  - @ledgerhq/crypto-icons-ui@1.7.0-next.0

## 0.26.1

### Patch Changes

- Updated dependencies [[`be83cab`](https://github.com/LedgerHQ/ledger-live/commit/be83cabecda649b52cb23be0d1f4ec822629b112)]:
  - @ledgerhq/ui-shared@0.3.0

## 0.26.1-next.0

### Patch Changes

- Updated dependencies [[`be83cab`](https://github.com/LedgerHQ/ledger-live/commit/be83cabecda649b52cb23be0d1f4ec822629b112)]:
  - @ledgerhq/ui-shared@0.3.0-next.0

## 0.26.0

### Minor Changes

- [#8322](https://github.com/LedgerHQ/ledger-live/pull/8322) [`a86b032`](https://github.com/LedgerHQ/ledger-live/commit/a86b0327e6b42f44119a645edc999cb08731c7e7) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade react-native-reanimated to 3.16.1

## 0.26.0-next.0

### Minor Changes

- [#8322](https://github.com/LedgerHQ/ledger-live/pull/8322) [`a86b032`](https://github.com/LedgerHQ/ledger-live/commit/a86b0327e6b42f44119a645edc999cb08731c7e7) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade react-native-reanimated to 3.16.1

## 0.25.3

### Patch Changes

- [#8167](https://github.com/LedgerHQ/ledger-live/pull/8167) [`9834c5e`](https://github.com/LedgerHQ/ledger-live/commit/9834c5ead567dea37b9ba7e85470dead48fe4844) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new AnimatedInputSelect in DS

- Updated dependencies [[`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25)]:
  - @ledgerhq/crypto-icons-ui@1.6.0

## 0.25.3-next.0

### Patch Changes

- [#8167](https://github.com/LedgerHQ/ledger-live/pull/8167) [`9834c5e`](https://github.com/LedgerHQ/ledger-live/commit/9834c5ead567dea37b9ba7e85470dead48fe4844) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new AnimatedInputSelect in DS

- Updated dependencies [[`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25)]:
  - @ledgerhq/crypto-icons-ui@1.6.0-next.0

## 0.25.2

### Patch Changes

- Updated dependencies [[`bc5048e`](https://github.com/LedgerHQ/ledger-live/commit/bc5048e0fda29b49a16b9e529fe0ace042267e8d)]:
  - @ledgerhq/icons-ui@0.8.1

## 0.25.2-next.0

### Patch Changes

- Updated dependencies [[`bc5048e`](https://github.com/LedgerHQ/ledger-live/commit/bc5048e0fda29b49a16b9e529fe0ace042267e8d)]:
  - @ledgerhq/icons-ui@0.8.1-next.0

## 0.25.1

### Patch Changes

- [#8067](https://github.com/LedgerHQ/ledger-live/pull/8067) [`bde70f9`](https://github.com/LedgerHQ/ledger-live/commit/bde70f93227bfb7c421536b4c60392c87d3d2a26) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - On Earn's Staking Modal, it makes it so that a category filter will only show up if there's at least one provider of that category.
  Small visual fix to the gap in the options' spacing
- Updated dependencies [[`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be)]:
  - @ledgerhq/crypto-icons-ui@1.5.1

## 0.25.1-next.0

### Patch Changes

- [#8067](https://github.com/LedgerHQ/ledger-live/pull/8067) [`bde70f9`](https://github.com/LedgerHQ/ledger-live/commit/bde70f93227bfb7c421536b4c60392c87d3d2a26) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - On Earn's Staking Modal, it makes it so that a category filter will only show up if there's at least one provider of that category.
  Small visual fix to the gap in the options' spacing
- Updated dependencies [[`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be)]:
  - @ledgerhq/crypto-icons-ui@1.5.1-next.0

## 0.25.0

### Minor Changes

- [#7989](https://github.com/LedgerHQ/ledger-live/pull/7989) [`191b105`](https://github.com/LedgerHQ/ledger-live/commit/191b105e6f1c76e674da6e9e109efe1b01937b99) Thanks [@thesan](https://github.com/thesan)! - Add the receive flow `NeedMemoTagModal`

### Patch Changes

- [#8077](https://github.com/LedgerHQ/ledger-live/pull/8077) [`1cc9725`](https://github.com/LedgerHQ/ledger-live/commit/1cc9725a45b1bd1ecb40f0b3d0f5a4605caa09a9) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - On Earn's Staking Modal, it makes it so that a category filter will only show up if there's at least one provider of that category.
  Small visual fix to the gap in the options' spacing

- [#7870](https://github.com/LedgerHQ/ledger-live/pull/7870) [`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - ledger-live-desktop: Updated staking modal. Filtering per category. New copy and design
  live-mobile: Updated staking modal. Filtering per category. New copy and design
  @ledgerhq/icons-ui: Add book-graduation icon
  @ledgerhq/types-live: Update schema of ethStakingProviders flag
  @ledgerhq/native-ui: Add `xs` size to Button
- Updated dependencies [[`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd)]:
  - @ledgerhq/icons-ui@0.8.0

## 0.25.0-next.1

### Patch Changes

- [#8077](https://github.com/LedgerHQ/ledger-live/pull/8077) [`1cc9725`](https://github.com/LedgerHQ/ledger-live/commit/1cc9725a45b1bd1ecb40f0b3d0f5a4605caa09a9) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - On Earn's Staking Modal, it makes it so that a category filter will only show up if there's at least one provider of that category.
  Small visual fix to the gap in the options' spacing

## 0.25.0-next.0

### Minor Changes

- [#7989](https://github.com/LedgerHQ/ledger-live/pull/7989) [`191b105`](https://github.com/LedgerHQ/ledger-live/commit/191b105e6f1c76e674da6e9e109efe1b01937b99) Thanks [@thesan](https://github.com/thesan)! - Add the receive flow `NeedMemoTagModal`

### Patch Changes

- [#7870](https://github.com/LedgerHQ/ledger-live/pull/7870) [`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - ledger-live-desktop: Updated staking modal. Filtering per category. New copy and design
  live-mobile: Updated staking modal. Filtering per category. New copy and design
  @ledgerhq/icons-ui: Add book-graduation icon
  @ledgerhq/types-live: Update schema of ethStakingProviders flag
  @ledgerhq/native-ui: Add `xs` size to Button
- Updated dependencies [[`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd)]:
  - @ledgerhq/icons-ui@0.8.0-next.0

## 0.24.1

### Patch Changes

- [#7941](https://github.com/LedgerHQ/ledger-live/pull/7941) [`2f90189`](https://github.com/LedgerHQ/ledger-live/commit/2f9018986102f23fa22d31605d0d9f99abd41892) Thanks [@thesan](https://github.com/thesan)! - Fix IDE go to definition feature for some libs

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c), [`2f90189`](https://github.com/LedgerHQ/ledger-live/commit/2f9018986102f23fa22d31605d0d9f99abd41892)]:
  - @ledgerhq/crypto-icons-ui@1.5.0
  - @ledgerhq/ui-shared@0.2.2
  - @ledgerhq/icons-ui@0.7.4

## 0.24.1-next.0

### Patch Changes

- [#7941](https://github.com/LedgerHQ/ledger-live/pull/7941) [`2f90189`](https://github.com/LedgerHQ/ledger-live/commit/2f9018986102f23fa22d31605d0d9f99abd41892) Thanks [@thesan](https://github.com/thesan)! - Fix IDE go to definition feature for some libs

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c), [`2f90189`](https://github.com/LedgerHQ/ledger-live/commit/2f9018986102f23fa22d31605d0d9f99abd41892)]:
  - @ledgerhq/crypto-icons-ui@1.5.0-next.0
  - @ledgerhq/ui-shared@0.2.2-next.0
  - @ledgerhq/icons-ui@0.7.4-next.0

## 0.24.0

### Minor Changes

- [#7749](https://github.com/LedgerHQ/ledger-live/pull/7749) [`1825bd3`](https://github.com/LedgerHQ/ledger-live/commit/1825bd36642e34e4b4aaeefb1805b04c87a32a22) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Storybook version + centering text in Button

### Patch Changes

- [#7590](https://github.com/LedgerHQ/ledger-live/pull/7590) [`e9bb8b9`](https://github.com/LedgerHQ/ledger-live/commit/e9bb8b969e3c07cb80a9247b8b5830693f35ef84) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Make llm tab selector component size following the size of the biggest label

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7467](https://github.com/LedgerHQ/ledger-live/pull/7467) [`3de93cc`](https://github.com/LedgerHQ/ledger-live/commit/3de93cc5597e0f87a70b9c728589a2ef363ac65d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the show qr code implementation for WS flow. Create tabSelector in RN UI Lib

- [#7702](https://github.com/LedgerHQ/ledger-live/pull/7702) [`531bc03`](https://github.com/LedgerHQ/ledger-live/commit/531bc03228d486e4b18f10df83b7b9bfdbd025b8) Thanks [@Justkant](https://github.com/Justkant)! - refactor: merge BottomDrawer containerStyle prop

- Updated dependencies [[`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4), [`9070cff`](https://github.com/LedgerHQ/ledger-live/commit/9070cffc83fd607b593c4b85a78faaf8e29f7acb)]:
  - @ledgerhq/crypto-icons-ui@1.4.1
  - @ledgerhq/icons-ui@0.7.3

## 0.24.0-next.0

### Minor Changes

- [#7749](https://github.com/LedgerHQ/ledger-live/pull/7749) [`1825bd3`](https://github.com/LedgerHQ/ledger-live/commit/1825bd36642e34e4b4aaeefb1805b04c87a32a22) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Storybook version + centering text in Button

### Patch Changes

- [#7590](https://github.com/LedgerHQ/ledger-live/pull/7590) [`e9bb8b9`](https://github.com/LedgerHQ/ledger-live/commit/e9bb8b969e3c07cb80a9247b8b5830693f35ef84) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Make llm tab selector component size following the size of the biggest label

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7467](https://github.com/LedgerHQ/ledger-live/pull/7467) [`3de93cc`](https://github.com/LedgerHQ/ledger-live/commit/3de93cc5597e0f87a70b9c728589a2ef363ac65d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the show qr code implementation for WS flow. Create tabSelector in RN UI Lib

- [#7702](https://github.com/LedgerHQ/ledger-live/pull/7702) [`531bc03`](https://github.com/LedgerHQ/ledger-live/commit/531bc03228d486e4b18f10df83b7b9bfdbd025b8) Thanks [@Justkant](https://github.com/Justkant)! - refactor: merge BottomDrawer containerStyle prop

- Updated dependencies [[`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4), [`9070cff`](https://github.com/LedgerHQ/ledger-live/commit/9070cffc83fd607b593c4b85a78faaf8e29f7acb)]:
  - @ledgerhq/crypto-icons-ui@1.4.1-next.0
  - @ledgerhq/icons-ui@0.7.3-next.0

## 0.23.3

### Patch Changes

- [#7307](https://github.com/LedgerHQ/ledger-live/pull/7307) [`77bcd53`](https://github.com/LedgerHQ/ledger-live/commit/77bcd539ad23daf7abc81e202665f6b9ab45c437) Thanks [@Justkant](https://github.com/Justkant)! - fix: use auto instead of fit-content that does not exist on RN

- [#7429](https://github.com/LedgerHQ/ledger-live/pull/7429) [`1100b21`](https://github.com/LedgerHQ/ledger-live/commit/1100b21581323317fb6c397019c4045edfe7954b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - Banner component title now limited to two lines

- Updated dependencies [[`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`fc3924d`](https://github.com/LedgerHQ/ledger-live/commit/fc3924df49de36ea1da2c2adb42fd5aeb6d3e545)]:
  - @ledgerhq/crypto-icons-ui@1.4.0
  - @ledgerhq/icons-ui@0.7.2

## 0.23.3-next.0

### Patch Changes

- [#7307](https://github.com/LedgerHQ/ledger-live/pull/7307) [`77bcd53`](https://github.com/LedgerHQ/ledger-live/commit/77bcd539ad23daf7abc81e202665f6b9ab45c437) Thanks [@Justkant](https://github.com/Justkant)! - fix: use auto instead of fit-content that does not exist on RN

- [#7429](https://github.com/LedgerHQ/ledger-live/pull/7429) [`1100b21`](https://github.com/LedgerHQ/ledger-live/commit/1100b21581323317fb6c397019c4045edfe7954b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - Banner component title now limited to two lines

- Updated dependencies [[`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`fc3924d`](https://github.com/LedgerHQ/ledger-live/commit/fc3924df49de36ea1da2c2adb42fd5aeb6d3e545)]:
  - @ledgerhq/crypto-icons-ui@1.4.0-next.0
  - @ledgerhq/icons-ui@0.7.2-next.0

## 0.23.2

### Patch Changes

- Updated dependencies [[`d1138d3`](https://github.com/LedgerHQ/ledger-live/commit/d1138d333a65e11b231f020a42ae62c64b91734e)]:
  - @ledgerhq/icons-ui@0.7.1

## 0.23.2-hotfix.0

### Patch Changes

- Updated dependencies [[`b3010eb`](https://github.com/LedgerHQ/ledger-live/commit/b3010ebcf99fe06436960d023fffd1cc549eea4a)]:
  - @ledgerhq/icons-ui@0.7.1-hotfix.0

## 0.23.1

### Patch Changes

- [#7215](https://github.com/LedgerHQ/ledger-live/pull/7215) [`f98ca2e`](https://github.com/LedgerHQ/ledger-live/commit/f98ca2e82f42036546a7b7005782a6f97213bc32) Thanks [@LucasWerey](https://github.com/LucasWerey)! - input animation triggers if there is any value entered

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04)]:
  - @ledgerhq/crypto-icons-ui@1.3.0

## 0.23.1-next.0

### Patch Changes

- [#7215](https://github.com/LedgerHQ/ledger-live/pull/7215) [`f98ca2e`](https://github.com/LedgerHQ/ledger-live/commit/f98ca2e82f42036546a7b7005782a6f97213bc32) Thanks [@LucasWerey](https://github.com/LucasWerey)! - input animation triggers if there is any value entered

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04)]:
  - @ledgerhq/crypto-icons-ui@1.3.0-next.0

## 0.23.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

### Patch Changes

- [#6606](https://github.com/LedgerHQ/ledger-live/pull/6606) [`972e3d1`](https://github.com/LedgerHQ/ledger-live/commit/972e3d193f3124cab56dda7a0fee5f718e954ff6) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - (test): add testID="modal-close-button" in BaseModal

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b)]:
  - @ledgerhq/crypto-icons-ui@1.2.0
  - @ledgerhq/icons-ui@0.7.0

## 0.23.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

### Patch Changes

- [#6606](https://github.com/LedgerHQ/ledger-live/pull/6606) [`972e3d1`](https://github.com/LedgerHQ/ledger-live/commit/972e3d193f3124cab56dda7a0fee5f718e954ff6) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - (test): add testID="modal-close-button" in BaseModal

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b)]:
  - @ledgerhq/crypto-icons-ui@1.2.0-next.0
  - @ledgerhq/icons-ui@0.7.0-next.0

## 0.22.9

### Patch Changes

- [#6304](https://github.com/LedgerHQ/ledger-live/pull/6304) [`f333b2f`](https://github.com/LedgerHQ/ledger-live/commit/f333b2f35b09265c3efae7907fb05cd03c4730b8) Thanks [@KVNLS](https://github.com/KVNLS)! - Update LLM send flow

- Updated dependencies [[`e13940e`](https://github.com/LedgerHQ/ledger-live/commit/e13940ea8b96098690a57c50dc989a5b6e6a6d28)]:
  - @ledgerhq/icons-ui@0.6.4

## 0.22.9-next.0

### Patch Changes

- [#6304](https://github.com/LedgerHQ/ledger-live/pull/6304) [`f333b2f`](https://github.com/LedgerHQ/ledger-live/commit/f333b2f35b09265c3efae7907fb05cd03c4730b8) Thanks [@KVNLS](https://github.com/KVNLS)! - Update LLM send flow

- Updated dependencies [[`e13940e`](https://github.com/LedgerHQ/ledger-live/commit/e13940ea8b96098690a57c50dc989a5b6e6a6d28)]:
  - @ledgerhq/icons-ui@0.6.4-next.0

## 0.22.8

### Patch Changes

- [#6099](https://github.com/LedgerHQ/ledger-live/pull/6099) [`486b0c8`](https://github.com/LedgerHQ/ledger-live/commit/486b0c8993715ce67a90b0a6c4fe177c04905719) Thanks [@mle-gall](https://github.com/mle-gall)! - Storybook Update : select control fix, mdx support on react, update of icons and icons doc.

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Created analytics prompt screens for variant A and B (main and secondary screens)

- [#6017](https://github.com/LedgerHQ/ledger-live/pull/6017) [`0a152fd`](https://github.com/LedgerHQ/ledger-live/commit/0a152fd4f51d189cf3b8d6b82975c252c246f9b8) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix : Switch has a black thumb in light-mode. Thumb should always be white, in both dark and light mode.

- Updated dependencies [[`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`486b0c8`](https://github.com/LedgerHQ/ledger-live/commit/486b0c8993715ce67a90b0a6c4fe177c04905719), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558)]:
  - @ledgerhq/crypto-icons-ui@1.1.0
  - @ledgerhq/icons-ui@0.6.3

## 0.22.8-next.1

### Patch Changes

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Created analytics prompt screens for variant A and B (main and secondary screens)

## 0.22.8-next.0

### Patch Changes

- [#6099](https://github.com/LedgerHQ/ledger-live/pull/6099) [`486b0c8`](https://github.com/LedgerHQ/ledger-live/commit/486b0c8993715ce67a90b0a6c4fe177c04905719) Thanks [@mle-gall](https://github.com/mle-gall)! - Storybook Update : select control fix, mdx support on react, update of icons and icons doc.

- [#5945](https://github.com/LedgerHQ/ledger-live/pull/5945) [`f551cd4`](https://github.com/LedgerHQ/ledger-live/commit/f551cd4d9798fddb4286f46bfa4632510af6d637) Thanks [@mle-gall](https://github.com/mle-gall)! - Created analytics prompt screens for variant A and B (main and secondary screens)

- [#6017](https://github.com/LedgerHQ/ledger-live/pull/6017) [`0a152fd`](https://github.com/LedgerHQ/ledger-live/commit/0a152fd4f51d189cf3b8d6b82975c252c246f9b8) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix : Switch has a black thumb in light-mode. Thumb should always be white, in both dark and light mode.

- Updated dependencies [[`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`486b0c8`](https://github.com/LedgerHQ/ledger-live/commit/486b0c8993715ce67a90b0a6c4fe177c04905719), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558)]:
  - @ledgerhq/crypto-icons-ui@1.1.0-next.0
  - @ledgerhq/icons-ui@0.6.3-next.0

## 0.22.7

### Patch Changes

- Updated dependencies [[`26f343b`](https://github.com/LedgerHQ/ledger-live/commit/26f343b3c08d06ce6e812947d4c63a6e5bae8a9e), [`f882dde`](https://github.com/LedgerHQ/ledger-live/commit/f882dde22ec194c5cd3dd9413b8c103108eba820)]:
  - @ledgerhq/crypto-icons-ui@1.0.2

## 0.22.7-next.0

### Patch Changes

- [#5945](https://github.com/LedgerHQ/ledger-live/pull/5945) [`f551cd4`](https://github.com/LedgerHQ/ledger-live/commit/f551cd4d9798fddb4286f46bfa4632510af6d637) Thanks [@mle-gall](https://github.com/mle-gall)! - Created analytics prompt screens for variant A and B (main and secondary screens)

- [#6017](https://github.com/LedgerHQ/ledger-live/pull/6017) [`0a152fd`](https://github.com/LedgerHQ/ledger-live/commit/0a152fd4f51d189cf3b8d6b82975c252c246f9b8) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix : Switch has a black thumb in light-mode. Thumb should always be white, in both dark and light mode.

- Updated dependencies [[`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558)]:
  - @ledgerhq/crypto-icons-ui@1.0.2-next.0

## 0.22.6

### Patch Changes

- [#5945](https://github.com/LedgerHQ/ledger-live/pull/5945) [`f551cd4`](https://github.com/LedgerHQ/ledger-live/commit/f551cd4d9798fddb4286f46bfa4632510af6d637) Thanks [@mle-gall](https://github.com/mle-gall)! - Created analytics prompt screens for variant A and B (main and secondary screens)

- [#6015](https://github.com/LedgerHQ/ledger-live/pull/6015) [`c8a9d49`](https://github.com/LedgerHQ/ledger-live/commit/c8a9d49bd5b82ba9dde23c8b397256f9d344ceef) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix : Switch has a black thumb in light-mode. Thumb should always be white, in both dark and light mode.

## 0.22.6-next.1

### Patch Changes

- [#6015](https://github.com/LedgerHQ/ledger-live/pull/6015) [`c8a9d49`](https://github.com/LedgerHQ/ledger-live/commit/c8a9d49bd5b82ba9dde23c8b397256f9d344ceef) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix : Switch has a black thumb in light-mode. Thumb should always be white, in both dark and light mode.

## 0.22.6-next.0

### Patch Changes

- [#5945](https://github.com/LedgerHQ/ledger-live/pull/5945) [`f551cd4`](https://github.com/LedgerHQ/ledger-live/commit/f551cd4d9798fddb4286f46bfa4632510af6d637) Thanks [@mle-gall](https://github.com/mle-gall)! - Created analytics prompt screens for variant A and B (main and secondary screens)

## 0.22.5

### Patch Changes

- [#5859](https://github.com/LedgerHQ/ledger-live/pull/5859) [`e1f967e`](https://github.com/LedgerHQ/ledger-live/commit/e1f967eb617a749a9f6dc58a7d1f4b6633f56d1c) Thanks [@mle-gall](https://github.com/mle-gall)! - Fixed warning on animatedInput (forwardRef not needed)

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6)]:
  - @ledgerhq/crypto-icons-ui@1.0.1

## 0.22.5-next.0

### Patch Changes

- [#5859](https://github.com/LedgerHQ/ledger-live/pull/5859) [`e1f967e`](https://github.com/LedgerHQ/ledger-live/commit/e1f967eb617a749a9f6dc58a7d1f4b6633f56d1c) Thanks [@mle-gall](https://github.com/mle-gall)! - Fixed warning on animatedInput (forwardRef not needed)

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6)]:
  - @ledgerhq/crypto-icons-ui@1.0.1-next.0

## 0.22.4

### Patch Changes

- [#5630](https://github.com/LedgerHQ/ledger-live/pull/5630) [`ad8f999`](https://github.com/LedgerHQ/ledger-live/commit/ad8f99994341b10d3f7af96543dd2c2028140573) Thanks [@mle-gall](https://github.com/mle-gall)! - New animated input (label morphes from placeholder to fixed label onFocus)

- Updated dependencies [[`0e2287b`](https://github.com/LedgerHQ/ledger-live/commit/0e2287b1ce4200004ed2c06f3e74cd3b03100784)]:
  - @ledgerhq/crypto-icons-ui@1.0.0

## 0.22.4-next.0

### Patch Changes

- [#5630](https://github.com/LedgerHQ/ledger-live/pull/5630) [`ad8f999`](https://github.com/LedgerHQ/ledger-live/commit/ad8f99994341b10d3f7af96543dd2c2028140573) Thanks [@mle-gall](https://github.com/mle-gall)! - New animated input (label morphes from placeholder to fixed label onFocus)

- Updated dependencies [[`0e2287b`](https://github.com/LedgerHQ/ledger-live/commit/0e2287b1ce4200004ed2c06f3e74cd3b03100784)]:
  - @ledgerhq/crypto-icons-ui@1.0.0-next.0

## 0.22.3

### Patch Changes

- [#5595](https://github.com/LedgerHQ/ledger-live/pull/5595) [`c094e4e`](https://github.com/LedgerHQ/ledger-live/commit/c094e4ed0c3220877d13703e20c77a0b013cd3ea) Thanks [@ak-ledger](https://github.com/ak-ledger)! - update react/native libs Storybook to 7.5.3

- [#5464](https://github.com/LedgerHQ/ledger-live/pull/5464) [`c4bc268`](https://github.com/LedgerHQ/ledger-live/commit/c4bc2688de43ad1f5ecec5e83d8e5c88edb6d372) Thanks [@mle-gall](https://github.com/mle-gall)! - Adding icons instructions

- Updated dependencies [[`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6)]:
  - @ledgerhq/crypto-icons-ui@0.7.0

## 0.22.3-next.0

### Patch Changes

- [#5595](https://github.com/LedgerHQ/ledger-live/pull/5595) [`c094e4e`](https://github.com/LedgerHQ/ledger-live/commit/c094e4ed0c3220877d13703e20c77a0b013cd3ea) Thanks [@ak-ledger](https://github.com/ak-ledger)! - update react/native libs Storybook to 7.5.3

- [#5464](https://github.com/LedgerHQ/ledger-live/pull/5464) [`c4bc268`](https://github.com/LedgerHQ/ledger-live/commit/c4bc2688de43ad1f5ecec5e83d8e5c88edb6d372) Thanks [@mle-gall](https://github.com/mle-gall)! - Adding icons instructions

- Updated dependencies [[`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6)]:
  - @ledgerhq/crypto-icons-ui@0.7.0-next.0

## 0.22.2

### Patch Changes

- Updated dependencies [[`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd)]:
  - @ledgerhq/crypto-icons-ui@0.6.1

## 0.22.2-next.0

### Patch Changes

- Updated dependencies [[`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd)]:
  - @ledgerhq/crypto-icons-ui@0.6.1-next.0

## 0.22.1

### Patch Changes

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade peerDependency react-native-reanimated to 3.3.0, devDependency expo to expo SDK 49 and metro to 0.79.0

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- Updated dependencies [[`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070)]:
  - @ledgerhq/crypto-icons-ui@0.6.0
  - @ledgerhq/icons-ui@0.6.2

## 0.22.1-next.0

### Patch Changes

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade peerDependency react-native-reanimated to 3.3.0, devDependency expo to expo SDK 49 and metro to 0.79.0

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- Updated dependencies [[`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070)]:
  - @ledgerhq/crypto-icons-ui@0.6.0-next.0
  - @ledgerhq/icons-ui@0.6.2-next.0

## 0.22.0

### Minor Changes

- [#4628](https://github.com/LedgerHQ/ledger-live/pull/4628) [`d1d0977f33`](https://github.com/LedgerHQ/ledger-live/commit/d1d0977f338beb860d40f4b38a9e123cbbb5ebbb) Thanks [@KVNLS](https://github.com/KVNLS)! - [LIVE-8347] Add quick actions on the wallet

## 0.22.0-next.0

### Minor Changes

- [#4628](https://github.com/LedgerHQ/ledger-live/pull/4628) [`d1d0977f33`](https://github.com/LedgerHQ/ledger-live/commit/d1d0977f338beb860d40f4b38a9e123cbbb5ebbb) Thanks [@KVNLS](https://github.com/KVNLS)! - [LIVE-8347] Add quick actions on the wallet

## 0.21.1

### Patch Changes

- [#4519](https://github.com/LedgerHQ/ledger-live/pull/4519) [`ea97040266`](https://github.com/LedgerHQ/ledger-live/commit/ea97040266cc0b0b084882739bd38a90908d2b98) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalStepper: pixel polish
  VerticalTimeline: fix aspect of lines

- [#4519](https://github.com/LedgerHQ/ledger-live/pull/4519) [`ea97040266`](https://github.com/LedgerHQ/ledger-live/commit/ea97040266cc0b0b084882739bd38a90908d2b98) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Text: fix the line height for bodyLineHeight variant

- Updated dependencies [[`41a38e953b`](https://github.com/LedgerHQ/ledger-live/commit/41a38e953b17075b5ab7bec307c147d8f74b7501)]:
  - @ledgerhq/icons-ui@0.6.1

## 0.21.0

### Minor Changes

- [#4421](https://github.com/LedgerHQ/ledger-live/pull/4421) [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Allow passing of onPressWhenDisabled prop to native ui button

### Patch Changes

- [#4385](https://github.com/LedgerHQ/ledger-live/pull/4385) [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade "react-native-svg" to 13.11.0

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`5b2247695c`](https://github.com/LedgerHQ/ledger-live/commit/5b2247695c80af26d8c3187df1cb53c95e3317b1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new type of Card in DS

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Introduce testID prop on Form/SelectableList

- Updated dependencies [[`5fb60bc6bb`](https://github.com/LedgerHQ/ledger-live/commit/5fb60bc6bb0bc6a9452d580cdace16ca87e478ff)]:
  - @ledgerhq/icons-ui@0.6.0

## 0.21.0-next.0

### Minor Changes

- [#4421](https://github.com/LedgerHQ/ledger-live/pull/4421) [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Allow passing of onPressWhenDisabled prop to native ui button

### Patch Changes

- [#4385](https://github.com/LedgerHQ/ledger-live/pull/4385) [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade "react-native-svg" to 13.11.0

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`5b2247695c`](https://github.com/LedgerHQ/ledger-live/commit/5b2247695c80af26d8c3187df1cb53c95e3317b1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new type of Card in DS

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Introduce testID prop on Form/SelectableList

- Updated dependencies [[`5fb60bc6bb`](https://github.com/LedgerHQ/ledger-live/commit/5fb60bc6bb0bc6a9452d580cdace16ca87e478ff)]:
  - @ledgerhq/icons-ui@0.6.0-next.0

## 0.20.6

### Patch Changes

- Updated dependencies [[`27e4a76f6c`](https://github.com/LedgerHQ/ledger-live/commit/27e4a76f6cc66aa6a7480f48329db04d33200c65)]:
  - @ledgerhq/icons-ui@0.5.0

## 0.20.6-hotfix.0

### Patch Changes

- Updated dependencies [[`27e4a76f6c`](https://github.com/LedgerHQ/ledger-live/commit/27e4a76f6cc66aa6a7480f48329db04d33200c65)]:
  - @ledgerhq/icons-ui@0.5.0-hotfix.0

## 0.20.5

### Patch Changes

- [#4214](https://github.com/LedgerHQ/ledger-live/pull/4214) [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6) Thanks [@mle-gall](https://github.com/mle-gall)! - Changes on the new icons to allow for correct rendering in Native environments + types changes in NativeUI

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6)]:
  - @ledgerhq/icons-ui@0.4.4

## 0.20.5-next.0

### Patch Changes

- [#4214](https://github.com/LedgerHQ/ledger-live/pull/4214) [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6) Thanks [@mle-gall](https://github.com/mle-gall)! - Changes on the new icons to allow for correct rendering in Native environments + types changes in NativeUI

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6)]:
  - @ledgerhq/icons-ui@0.4.4-next.0

## 0.20.4

### Patch Changes

- [#4259](https://github.com/LedgerHQ/ledger-live/pull/4259) [`5696f24b93`](https://github.com/LedgerHQ/ledger-live/commit/5696f24b93151bc0ee063d1cb88cef1e2d052f9e) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - publish ui libraries with fixed tests

- Updated dependencies [[`5696f24b93`](https://github.com/LedgerHQ/ledger-live/commit/5696f24b93151bc0ee063d1cb88cef1e2d052f9e)]:
  - @ledgerhq/crypto-icons-ui@0.5.1
  - @ledgerhq/icons-ui@0.4.3
  - @ledgerhq/ui-shared@0.2.1

## 0.20.3

### Patch Changes

- [#4091](https://github.com/LedgerHQ/ledger-live/pull/4091) [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7) Thanks [@mle-gall](https://github.com/mle-gall)! - UILib - New icons + renamed old icon set to Legacy (should not be used anymore by consumers eg LLD and LLM)

- [#3792](https://github.com/LedgerHQ/ledger-live/pull/3792) [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c) Thanks [@grsoares21](https://github.com/grsoares21)! - Add background color as a configurable prop to the IconBadge component

- Updated dependencies [[`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`5840cdbb4f`](https://github.com/LedgerHQ/ledger-live/commit/5840cdbb4fad09865d672a009f98b4fea3cffebe), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce)]:
  - @ledgerhq/icons-ui@0.4.2
  - @ledgerhq/crypto-icons-ui@0.5.0

## 0.20.3-next.0

### Patch Changes

- [#4091](https://github.com/LedgerHQ/ledger-live/pull/4091) [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7) Thanks [@mle-gall](https://github.com/mle-gall)! - UILib - New icons + renamed old icon set to Legacy (should not be used anymore by consumers eg LLD and LLM)

- [#3792](https://github.com/LedgerHQ/ledger-live/pull/3792) [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c) Thanks [@grsoares21](https://github.com/grsoares21)! - Add background color as a configurable prop to the IconBadge component

- Updated dependencies [[`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`5840cdbb4f`](https://github.com/LedgerHQ/ledger-live/commit/5840cdbb4fad09865d672a009f98b4fea3cffebe), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce)]:
  - @ledgerhq/icons-ui@0.4.2-next.0
  - @ledgerhq/crypto-icons-ui@0.5.0-next.0

## 0.20.2

### Patch Changes

- Updated dependencies [[`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b)]:
  - @ledgerhq/crypto-icons-ui@0.4.0

## 0.20.2-next.0

### Patch Changes

- Updated dependencies [[`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b)]:
  - @ledgerhq/crypto-icons-ui@0.4.0-next.0

## 0.20.1

### Patch Changes

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Adding new type of Modal with background image

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Update Bottom Drawer Modal

- Updated dependencies [[`7ae4766e09`](https://github.com/LedgerHQ/ledger-live/commit/7ae4766e094d928f58e820319a33900b88a67502)]:
  - @ledgerhq/icons-ui@0.4.1

## 0.20.1-next.0

### Patch Changes

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Adding new type of Modal with background image

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Update Bottom Drawer Modal

- Updated dependencies [[`7ae4766e09`](https://github.com/LedgerHQ/ledger-live/commit/7ae4766e094d928f58e820319a33900b88a67502)]:
  - @ledgerhq/icons-ui@0.4.1-next.0

## 0.20.0

### Minor Changes

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Memo vertical timeline component and export ItemStatus differently

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add IconBadge component

## 0.20.0-next.0

### Minor Changes

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Memo vertical timeline component and export ItemStatus differently

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add IconBadge component

## 0.19.1

### Patch Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: bumped react-native-reanimated to v3.1.0

- [#3365](https://github.com/LedgerHQ/ledger-live/pull/3365) [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Vertical Timeline (fixed crash + pixel polish) + pixel polish of the Sync Onboarding including language selection (now used in welcome screen)

## 0.19.1-next.0

### Patch Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: bumped react-native-reanimated to v3.1.0

- [#3365](https://github.com/LedgerHQ/ledger-live/pull/3365) [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Vertical Timeline (fixed crash + pixel polish) + pixel polish of the Sync Onboarding including language selection (now used in welcome screen)

## 0.19.0

### Minor Changes

- [#3253](https://github.com/LedgerHQ/ledger-live/pull/3253) [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Alert component: new design, new types "secondary" and "success", removed renderContent prop

### Patch Changes

- [#3118](https://github.com/LedgerHQ/ledger-live/pull/3118) [`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat: refactor/homogenise headers

  Homogenize headers in navigators and in the main screens accessible from the Main navigator tab bar
  Prevent blocking state due to already paired device in Stax onboarding

- Updated dependencies [[`c8920896d7`](https://github.com/LedgerHQ/ledger-live/commit/c8920896d7c96cab88f95ce705dc55aac5b345bc), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949)]:
  - @ledgerhq/ui-shared@0.2.0
  - @ledgerhq/crypto-icons-ui@0.3.0

## 0.19.0-next.0

### Minor Changes

- [#3253](https://github.com/LedgerHQ/ledger-live/pull/3253) [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Alert component: new design, new types "secondary" and "success", removed renderContent prop

### Patch Changes

- [#3118](https://github.com/LedgerHQ/ledger-live/pull/3118) [`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat: refactor/homogenise headers

  Homogenize headers in navigators and in the main screens accessible from the Main navigator tab bar
  Prevent blocking state due to already paired device in Stax onboarding

- Updated dependencies [[`c8920896d7`](https://github.com/LedgerHQ/ledger-live/commit/c8920896d7c96cab88f95ce705dc55aac5b345bc), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949)]:
  - @ledgerhq/ui-shared@0.2.0-next.0
  - @ledgerhq/crypto-icons-ui@0.3.0-next.0

## 0.18.1

### Patch Changes

- [#2817](https://github.com/LedgerHQ/ledger-live/pull/2817) [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a variant of the tiny text style with Alpha font family

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade dependencies

- [#3125](https://github.com/LedgerHQ/ledger-live/pull/3125) [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed old icon weights (everything except Medium). Deprecated Weigth prop in Icon component

- Updated dependencies [[`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27), [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5)]:
  - @ledgerhq/crypto-icons-ui@0.2.2
  - @ledgerhq/icons-ui@0.4.0

## 0.18.1-next.0

### Patch Changes

- [#2817](https://github.com/LedgerHQ/ledger-live/pull/2817) [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a variant of the tiny text style with Alpha font family

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade dependencies

- [#3125](https://github.com/LedgerHQ/ledger-live/pull/3125) [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed old icon weights (everything except Medium). Deprecated Weigth prop in Icon component

- Updated dependencies [[`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27), [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5)]:
  - @ledgerhq/crypto-icons-ui@0.2.2-next.0
  - @ledgerhq/icons-ui@0.4.0-next.0

## 0.18.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

## 0.18.0-next.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

## 0.17.0

### Minor Changes

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix metro config (forced dependencies)
  ContinueOnDevice: new UI item to indicate the user to continue on the device
  Divider: add a `text` prop to display some text in the middle of the divider
  VerticalTimeline: new appearance (colors, fonts, dashed lines, icon sizes)
  VerticalTimeline: make it scrollable (no need to wrap it in a ScrollView)
  VerticalTimeline: add auto scrolling to active item
  VerticalTimeline: add `header?: React.ReactNode | null` prop
  VerticalTimeline: expose `BodyText` and `SubtitleText` components
  Storybook - VerticalTimeline: more exhaustive examples

## 0.17.0-next.0

### Minor Changes

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix metro config (forced dependencies)
  ContinueOnDevice: new UI item to indicate the user to continue on the device
  Divider: add a `text` prop to display some text in the middle of the divider
  VerticalTimeline: new appearance (colors, fonts, dashed lines, icon sizes)
  VerticalTimeline: make it scrollable (no need to wrap it in a ScrollView)
  VerticalTimeline: add auto scrolling to active item
  VerticalTimeline: add `header?: React.ReactNode | null` prop
  VerticalTimeline: expose `BodyText` and `SubtitleText` components
  Storybook - VerticalTimeline: more exhaustive examples

## 0.16.0

### Minor Changes

- [#2713](https://github.com/LedgerHQ/ledger-live/pull/2713) [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new VerticalStepper component to Natie UI, similar to the VerticalTimeline but featuring a new design and nesting capabilities

### Patch Changes

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove cycle dependencies

- Updated dependencies [[`13a71f1cb2`](https://github.com/LedgerHQ/ledger-live/commit/13a71f1cb24fa254a2ed0b2db7f0d7b8f32465b5)]:
  - @ledgerhq/icons-ui@0.3.5

## 0.16.0-next.0

### Minor Changes

- [#2713](https://github.com/LedgerHQ/ledger-live/pull/2713) [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new VerticalStepper component to Natie UI, similar to the VerticalTimeline but featuring a new design and nesting capabilities

### Patch Changes

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove cycle dependencies

- Updated dependencies [[`13a71f1cb2`](https://github.com/LedgerHQ/ledger-live/commit/13a71f1cb24fa254a2ed0b2db7f0d7b8f32465b5)]:
  - @ledgerhq/icons-ui@0.3.5-next.0

## 0.15.1

### Patch Changes

- [#2503](https://github.com/LedgerHQ/ledger-live/pull/2503) [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Minor ui modifications to Link, FullBackgroundCard and SideImageCard components

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onModalHide passed down to ReactNativeModal

  `BaseModal` was not passing down `onModalHide` to `ReactNativeModal`. Until this, `onModalHide={onClose}`, making `onClose` being called twice (once when the user closes the modal, once when the modal is hidden) and `onModalHide` being never called.

  The fix is a workaround so we don't break legacy components that use `BaseModal`. The long-term fix would be to have `onModalHide={onModalHide}` and make sure every usage on `onClose` in the consumers of this component expect the correct behavior.

## 0.15.1-next.0

### Patch Changes

- [#2503](https://github.com/LedgerHQ/ledger-live/pull/2503) [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Minor ui modifications to Link, FullBackgroundCard and SideImageCard components

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onModalHide passed down to ReactNativeModal

  `BaseModal` was not passing down `onModalHide` to `ReactNativeModal`. Until this, `onModalHide={onClose}`, making `onClose` being called twice (once when the user closes the modal, once when the modal is hidden) and `onModalHide` being never called.

  The fix is a workaround so we don't break legacy components that use `BaseModal`. The long-term fix would be to have `onModalHide={onModalHide}` and make sure every usage on `onClose` in the consumers of this component expect the correct behavior.

## 0.15.0

### Minor Changes

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Native UI - NotificationCard component added to the ui library

### Patch Changes

- [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- Updated dependencies [[`5266518d0b`](https://github.com/LedgerHQ/ledger-live/commit/5266518d0baf26258f95a08d7f0a127f1848b38f)]:
  - @ledgerhq/icons-ui@0.3.4

## 0.15.0-next.0

### Minor Changes

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Native UI - NotificationCard component added to the ui library

### Patch Changes

- [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- Updated dependencies [[`5266518d0b`](https://github.com/LedgerHQ/ledger-live/commit/5266518d0baf26258f95a08d7f0a127f1848b38f)]:
  - @ledgerhq/icons-ui@0.3.4-next.0

## 0.14.0

### Minor Changes

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - NativeUI - add colo and text Color to tag component

### Patch Changes

- Updated dependencies [[`32993aea9a`](https://github.com/LedgerHQ/ledger-live/commit/32993aea9af5dfb7f2519263e5f2a22a88320cdc)]:
  - @ledgerhq/icons-ui@0.3.3

## 0.14.0-next.0

### Minor Changes

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - NativeUI - add colo and text Color to tag component

### Patch Changes

- Updated dependencies [[`32993aea9a`](https://github.com/LedgerHQ/ledger-live/commit/32993aea9af5dfb7f2519263e5f2a22a88320cdc)]:
  - @ledgerhq/icons-ui@0.3.3-next.0

## 0.13.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Two Cards components (FullBackgroundCard and SideImageCard) added to the native-ui lib

### Patch Changes

- Updated dependencies [[`e3222832ba`](https://github.com/LedgerHQ/ledger-live/commit/e3222832ba1fc7f90940fe637bf4a29361a72d94), [`1269f149ae`](https://github.com/LedgerHQ/ledger-live/commit/1269f149aef5d842eddd83beb64ae65240c3dc0f)]:
  - @ledgerhq/icons-ui@0.3.2

## 0.13.0-next.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Two Cards components (FullBackgroundCard and SideImageCard) added to the native-ui lib

### Patch Changes

- Updated dependencies [[`e3222832ba`](https://github.com/LedgerHQ/ledger-live/commit/e3222832ba1fc7f90940fe637bf4a29361a72d94), [`1269f149ae`](https://github.com/LedgerHQ/ledger-live/commit/1269f149aef5d842eddd83beb64ae65240c3dc0f)]:
  - @ledgerhq/icons-ui@0.3.2-next.0

## 0.12.2

### Patch Changes

- [#1936](https://github.com/LedgerHQ/ledger-live/pull/1936) [`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed PNG icons for boxed ProviderIcons and replaced them with svg(r)

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: fix item title long text layout & remove item vertical scroll indicator

* Updated dependencies [[`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1), [`828af17431`](https://github.com/LedgerHQ/ledger-live/commit/828af1743180ccf0f21a7de143cb910ef7258407)]:
  - @ledgerhq/icons-ui@0.3.1

## 0.12.2-next.0

### Patch Changes

- [#1936](https://github.com/LedgerHQ/ledger-live/pull/1936) [`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed PNG icons for boxed ProviderIcons and replaced them with svg(r)

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: fix item title long text layout & remove item vertical scroll indicator

* Updated dependencies [[`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1), [`828af17431`](https://github.com/LedgerHQ/ledger-live/commit/828af1743180ccf0f21a7de143cb910ef7258407)]:
  - @ledgerhq/icons-ui@0.3.1-next.0

## 0.12.1

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4), [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/icons-ui@0.3.0
  - @ledgerhq/crypto-icons-ui@0.2.1
  - @ledgerhq/ui-shared@0.1.10

## 0.12.1-next.0

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4), [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/icons-ui@0.3.0-next.0
  - @ledgerhq/crypto-icons-ui@0.2.1-next.0
  - @ledgerhq/ui-shared@0.1.10-next.0

## 0.12.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add a vertical timeline component to Native UI

### Patch Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

## 0.12.0-next.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add a vertical timeline component to Native UI

### Patch Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

## 0.11.0

### Minor Changes

- [#1457](https://github.com/LedgerHQ/ledger-live/pull/1457) [`4ec8df33ea`](https://github.com/LedgerHQ/ledger-live/commit/4ec8df33ea223c412cb81892bf0380d456e19b54) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new vertical timeline component

### Patch Changes

- [#1480](https://github.com/LedgerHQ/ledger-live/pull/1480) [`22725d35e5`](https://github.com/LedgerHQ/ledger-live/commit/22725d35e59c79759e7cdd295ac5b7ebbb774ee2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: add dynamic height capability (with animation)

## 0.11.0-next.0

### Minor Changes

- [#1457](https://github.com/LedgerHQ/ledger-live/pull/1457) [`4ec8df33ea`](https://github.com/LedgerHQ/ledger-live/commit/4ec8df33ea223c412cb81892bf0380d456e19b54) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new vertical timeline component

### Patch Changes

- [#1480](https://github.com/LedgerHQ/ledger-live/pull/1480) [`22725d35e5`](https://github.com/LedgerHQ/ledger-live/commit/22725d35e59c79759e7cdd295ac5b7ebbb774ee2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: add dynamic height capability (with animation)

## 0.10.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

### Patch Changes

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "delay" prop to Transitions.Fade

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add largeLineHeight text variant

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.10.0-next.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

### Patch Changes

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "delay" prop to Transitions.Fade

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add largeLineHeight text variant

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.9.0

### Minor Changes

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244c`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: change appearance (new design)

* [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

* [#976](https://github.com/LedgerHQ/ledger-live/pull/976) [`f28d403542`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751) Thanks [@grsoares21](https://github.com/grsoares21)! - Add Divider component to the native ui

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244c`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: remove "active" prop

### Patch Changes

- [#891](https://github.com/LedgerHQ/ledger-live/pull/891) [`092a887af5`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add h1Inter text variant (h1 with Inter font)

- Updated dependencies [[`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0

## 0.9.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

## 0.9.0-next.0

### Minor Changes

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: change appearance (new design)

* [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

- [#976](https://github.com/LedgerHQ/ledger-live/pull/976) [`f28d40354`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751) Thanks [@grsoares21](https://github.com/grsoares21)! - Add Divider component to the native ui

* [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: remove "active" prop

### Patch Changes

- [#891](https://github.com/LedgerHQ/ledger-live/pull/891) [`092a887af`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add h1Inter text variant (h1 with Inter font)

- Updated dependencies [[`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0-next.0

## 0.8.3

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Button component uses correct TouchableOpacity instead of Highlight

* [#440](https://github.com/LedgerHQ/ledger-live/pull/440) [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - native - notifications component styles extended

## 0.8.3-next.1

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Button component uses correct TouchableOpacity instead of Highlight

## 0.8.3-next.0

### Patch Changes

- [#440](https://github.com/LedgerHQ/ledger-live/pull/440) [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - native - notifications component styles extended

## 0.8.2

### Patch Changes

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7

## 0.8.2-next.0

### Patch Changes

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`429df1cff`](https://github.com/LedgerHQ/ledger-live/commit/429df1cff3cf204ff57200553a808d25c8ff413f)]:
  - @ledgerhq/icons-ui@0.2.6

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [429df1cff]
  - @ledgerhq/icons-ui@0.2.6-next.0

## 0.8.0

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.

### Patch Changes

- dd6a12c9b: Fix ScrollListContainer ref not being forwarded to FlatList
- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9
  - @ledgerhq/icons-ui@0.2.5

## 0.8.0-next.2

### Patch Changes

- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9-next.0
  - @ledgerhq/icons-ui@0.2.5-next.0

## 0.8.0-next.1

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.

## 0.7.19-next.0

### Patch Changes

- dd6a12c9b: Fix ScrollListContainer ref not being forwarded to FlatList

## 0.7.18

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8

## 0.7.18-next.0

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8-next.0
