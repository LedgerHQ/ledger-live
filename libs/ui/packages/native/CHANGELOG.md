# @ledgerhq/native-ui

## 0.66.0

### Minor Changes

- [#20262](https://github.com/LedgerHQ/ledger-live/pull/20262) [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `CryptoIcon` passthrough component from `@ledgerhq/native-ui/pre-ldls` and consume `@ledgerhq/crypto-icons/native` directly in ledger-live-mobile. `@ledgerhq/crypto-icons` is no longer a dependency of `@ledgerhq/native-ui`, and the `@ledgerhq/lumen-ui-rnative` / `@ledgerhq/lumen-design-core` peer dependencies it required are dropped as well.

- [#20398](https://github.com/LedgerHQ/ledger-live/pull/20398) [`625c6c0`](https://github.com/LedgerHQ/ledger-live/commit/625c6c0628d0c4afe395f45fbb39a988af8aa106) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Declare `./assets/icons` explicitly in `exports`, drop the unused `stylis` dependency and remove four files that had no consumer left: `src/icons/Close.tsx`, `src/styles/InvertTheme.tsx`, `storybook/stories/index.ts` and `storybook/constants/globalStyles.ts`

## 0.66.0-next.0

### Minor Changes

- [#20262](https://github.com/LedgerHQ/ledger-live/pull/20262) [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `CryptoIcon` passthrough component from `@ledgerhq/native-ui/pre-ldls` and consume `@ledgerhq/crypto-icons/native` directly in ledger-live-mobile. `@ledgerhq/crypto-icons` is no longer a dependency of `@ledgerhq/native-ui`, and the `@ledgerhq/lumen-ui-rnative` / `@ledgerhq/lumen-design-core` peer dependencies it required are dropped as well.

- [#20398](https://github.com/LedgerHQ/ledger-live/pull/20398) [`625c6c0`](https://github.com/LedgerHQ/ledger-live/commit/625c6c0628d0c4afe395f45fbb39a988af8aa106) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Declare `./assets/icons` explicitly in `exports`, drop the unused `stylis` dependency and remove four files that had no consumer left: `src/icons/Close.tsx`, `src/styles/InvertTheme.tsx`, `storybook/stories/index.ts` and `storybook/constants/globalStyles.ts`

## 0.65.0

### Minor Changes

- [#20122](https://github.com/LedgerHQ/ledger-live/pull/20122) [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Migrate the mobile Modular Drawer to Lumen components (BottomSheet, ListItem, SearchInput, Banner, CardButton, Trend, Tag, Box/Text) and drop the legacy `native-ui` primitives and the `pre-ldls` composites it used. Removes the now-unused `pre-ldls` staging components (AssetItem, NetworkItem, AccountItem, Address, Tag, Input, Search, AssetTypeList, NetworkList, MarketPriceIndicator, MarketPercentIndicator) and the orphaned `useDebouncedCallback` hook from `@ledgerhq/native-ui` (CryptoIcon and AddAccountButton are kept). Adds the empty-account state (header description + "Add account" CardButton) on the account step.

## 0.65.0-next.0

### Minor Changes

- [#20122](https://github.com/LedgerHQ/ledger-live/pull/20122) [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Migrate the mobile Modular Drawer to Lumen components (BottomSheet, ListItem, SearchInput, Banner, CardButton, Trend, Tag, Box/Text) and drop the legacy `native-ui` primitives and the `pre-ldls` composites it used. Removes the now-unused `pre-ldls` staging components (AssetItem, NetworkItem, AccountItem, Address, Tag, Input, Search, AssetTypeList, NetworkList, MarketPriceIndicator, MarketPercentIndicator) and the orphaned `useDebouncedCallback` hook from `@ledgerhq/native-ui` (CryptoIcon and AddAccountButton are kept). Adds the empty-account state (header description + "Add account" CardButton) on the account step.

## 0.64.0

### Minor Changes

- [#17924](https://github.com/LedgerHQ/ledger-live/pull/17924) [`360cea4`](https://github.com/LedgerHQ/ledger-live/commit/360cea435daf7093d853f4ad6402327c6a285895) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Upgrade React Native to 0.81.6, Expo SDK 54 for LWM; React 19.1.4 for LWM and LWD

## 0.64.0-next.0

### Minor Changes

- [#17924](https://github.com/LedgerHQ/ledger-live/pull/17924) [`360cea4`](https://github.com/LedgerHQ/ledger-live/commit/360cea435daf7093d853f4ad6402327c6a285895) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Upgrade React Native to 0.81.6, Expo SDK 54 for LWM; React 19.1.4 for LWM and LWD

## 0.63.0

### Minor Changes

- [#17390](https://github.com/LedgerHQ/ledger-live/pull/17390) [`04aa5f8`](https://github.com/LedgerHQ/ledger-live/commit/04aa5f8d9a8a2916a29b70a26f3802612c357410) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump crypto-icons with latest lumen bump

## 0.63.0-next.0

### Minor Changes

- [#17390](https://github.com/LedgerHQ/ledger-live/pull/17390) [`04aa5f8`](https://github.com/LedgerHQ/ledger-live/commit/04aa5f8d9a8a2916a29b70a26f3802612c357410) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump crypto-icons with latest lumen bump

## 0.62.0

### Minor Changes

- [#16849](https://github.com/LedgerHQ/ledger-live/pull/16849) [`d44eed1`](https://github.com/LedgerHQ/ledger-live/commit/d44eed1c2a7a7dbdb0a806082ff227045d0be615) Thanks [@LucasWerey](https://github.com/LucasWerey)! - bump @ledgerhq/crypto-icons to v2.0.1 and migrate breaking changes

- [#16977](https://github.com/LedgerHQ/ledger-live/pull/16977) [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be) Thanks [@CremaFR](https://github.com/CremaFR)! - Fix native crash caused by invalid `width: "fit-content"` in MarketPriceIndicator and MarketPercentIndicator components, and improve Redux selector memoization for market/interest-rate hooks

## 0.62.0-next.0

### Minor Changes

- [#16849](https://github.com/LedgerHQ/ledger-live/pull/16849) [`d44eed1`](https://github.com/LedgerHQ/ledger-live/commit/d44eed1c2a7a7dbdb0a806082ff227045d0be615) Thanks [@LucasWerey](https://github.com/LucasWerey)! - bump @ledgerhq/crypto-icons to v2.0.1 and migrate breaking changes

- [#16977](https://github.com/LedgerHQ/ledger-live/pull/16977) [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be) Thanks [@CremaFR](https://github.com/CremaFR)! - Fix native crash caused by invalid `width: "fit-content"` in MarketPriceIndicator and MarketPercentIndicator components, and improve Redux selector memoization for market/interest-rate hooks

## 0.61.0

### Minor Changes

- [#16050](https://github.com/LedgerHQ/ledger-live/pull/16050) [`748b03a`](https://github.com/LedgerHQ/ledger-live/commit/748b03a3508caa3c48a950b5df2a1a78ac524c90) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: replace eslint/prettier with oxlint/oxfmt in libs/ui

## 0.61.0-next.0

### Minor Changes

- [#16050](https://github.com/LedgerHQ/ledger-live/pull/16050) [`748b03a`](https://github.com/LedgerHQ/ledger-live/commit/748b03a3508caa3c48a950b5df2a1a78ac524c90) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: replace eslint/prettier with oxlint/oxfmt in libs/ui

## 0.60.0

### Minor Changes

- [#14458](https://github.com/LedgerHQ/ledger-live/pull/14458) [`175471d`](https://github.com/LedgerHQ/ledger-live/commit/175471d9420ba21bba9245c21f5c8c5dbece418e) Thanks [@cseille](https://github.com/cseille)! - Display APY in green for non-UK users in Modular Asset Drawer.
  Remove temporary APY indicator from pre-ldls, react-ui and native-ui components

## 0.60.0-next.0

### Minor Changes

- [#14458](https://github.com/LedgerHQ/ledger-live/pull/14458) [`175471d`](https://github.com/LedgerHQ/ledger-live/commit/175471d9420ba21bba9245c21f5c8c5dbece418e) Thanks [@cseille](https://github.com/cseille)! - Display APY in green for non-UK users in Modular Asset Drawer.
  Remove temporary APY indicator from pre-ldls, react-ui and native-ui components

## 0.59.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14937](https://github.com/LedgerHQ/ledger-live/pull/14937) [`89c9aaa`](https://github.com/LedgerHQ/ledger-live/commit/89c9aaae69c843b12678f4e78ea125b51f45fba1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - replace broken rn-range-slider with @react-native-community/slider

## 0.59.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14937](https://github.com/LedgerHQ/ledger-live/pull/14937) [`89c9aaa`](https://github.com/LedgerHQ/ledger-live/commit/89c9aaae69c843b12678f4e78ea125b51f45fba1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - replace broken rn-range-slider with @react-native-community/slider

## 0.58.0

### Minor Changes

- [#14616](https://github.com/LedgerHQ/ledger-live/pull/14616) [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate to React 19.

- [#14688](https://github.com/LedgerHQ/ledger-live/pull/14688) [`ed0368f`](https://github.com/LedgerHQ/ledger-live/commit/ed0368f4a18b455f5eba1e0fef13d5cd0e0a405d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat: add trackings wallet v4 tour

- [#14596](https://github.com/LedgerHQ/ledger-live/pull/14596) [`e030c16`](https://github.com/LedgerHQ/ledger-live/commit/e030c161668c4fb2a79a96640eaed881251a3e86) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat(mobile): add lottie animations to Wallet V4 Tour drawer slides

### Patch Changes

- Updated dependencies [[`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77)]:
  - @ledgerhq/icons-ui@0.20.0

## 0.58.0-next.0

### Minor Changes

- [#14616](https://github.com/LedgerHQ/ledger-live/pull/14616) [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate to React 19.

- [#14688](https://github.com/LedgerHQ/ledger-live/pull/14688) [`ed0368f`](https://github.com/LedgerHQ/ledger-live/commit/ed0368f4a18b455f5eba1e0fef13d5cd0e0a405d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat: add trackings wallet v4 tour

- [#14596](https://github.com/LedgerHQ/ledger-live/pull/14596) [`e030c16`](https://github.com/LedgerHQ/ledger-live/commit/e030c161668c4fb2a79a96640eaed881251a3e86) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat(mobile): add lottie animations to Wallet V4 Tour drawer slides

### Patch Changes

- Updated dependencies [[`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77)]:
  - @ledgerhq/icons-ui@0.20.0-next.0

## 0.57.0

### Minor Changes

- [#14266](https://github.com/LedgerHQ/ledger-live/pull/14266) [`2f07682`](https://github.com/LedgerHQ/ledger-live/commit/2f07682ccfb504caf38ba8798e3b22847302890d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Wallet V4 Tour drawer with slides showcasing new features

## 0.57.0-next.0

### Minor Changes

- [#14266](https://github.com/LedgerHQ/ledger-live/pull/14266) [`2f07682`](https://github.com/LedgerHQ/ledger-live/commit/2f07682ccfb504caf38ba8798e3b22847302890d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Wallet V4 Tour drawer with slides showcasing new features

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
