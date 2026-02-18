# Lumen BottomSheet Migration — Cleanup Guide

When the migration is validated in production, follow these steps to remove the legacy code.

## 1. Delete the temp/ folder entirely

```
src/mvvm/components/QueuedDrawer/temp/
├── QueuedDrawerGorhom.tsx
├── useQueuedDrawerGorhom.ts
└── components/
    ├── BackDrop.tsx
    └── Header.tsx
```

## 2. Delete legacy view files

- `src/mvvm/features/QuickActions/screens/TransferDrawer/TransferDrawerViewLegacy.tsx`

## 3. Remove if/else branches in consumers

For each file below, remove the `useWalletFeaturesConfig` check and keep only the `isEnabled` (Lumen) branch:

- `src/mvvm/features/QuickActions/screens/TransferDrawer/index.tsx`
  - Remove QueuedDrawerGorhom import + legacy branch
- `src/mvvm/components/FearAndGreed/FearAndGreedView.tsx`
  - Remove QueuedDrawerGorhom + GorhomBottomSheetView imports + legacy branch
- `src/mvvm/features/Receive/drawers/ReceiveFundsOptionsDrawer.tsx`
  - Remove QueuedDrawerGorhom import + legacy branch
- `src/mvvm/features/ModularDrawer/ModularDrawer.tsx`
  - Remove QueuedDrawerGorhom import + legacy branch + `keyboardBehavior` prop
- `src/screens/SyncOnboarding/LanguageSelect.tsx`
  - Remove QueuedDrawerGorhom + GorhomBottomSheetScrollView imports + legacy branch + `ScrollViewContainer` styled component
- `src/mvvm/features/ModularDrawer/ModularDrawerFlowManager/ModularDrawerFlowView.tsx`
  - Remove `Title` import + `useLumenBottomSheet` prop passing + `!isEnabled && <Title>` branch
- `src/mvvm/features/ModularDrawer/screens/AssetSelection/index.tsx`
  - Remove `useLumenBottomSheet` prop + legacy search/marginTop branch + `LEGACY_LIST_STYLE` + `withHorizontalPadding`
- `src/mvvm/features/ModularDrawer/screens/NetworkSelection/index.tsx`
  - Remove `useLumenBottomSheet` prop + conditional BottomSheetHeader + `LEGACY_LIST_STYLE`
- `src/mvvm/features/ModularDrawer/screens/AccountSelection/index.tsx`
  - Remove `useLumenBottomSheet` prop + conditional BottomSheetHeader + marginTop + `LEGACY_LIST_STYLE`
- `src/mvvm/features/ModularDrawer/screens/AssetSelection/components/SearchInputContainer/index.tsx`
  - Remove `withHorizontalPadding` prop

## 4. Migrate AssetSelection search into BottomSheetHeader trailingContent (deferred)

The `BottomSheetHeader` `trailingContent` (for embedding the search input in the header) in `AssetSelection` was **deferred** because the Lumen-side `trailingContent` feature was not shipped yet. Currently the search input is rendered below the `BottomSheetHeader` as regular content. When `trailingContent` is available in Lumen:

- Move search input into `BottomSheetHeader`'s `trailingContent` prop in `AssetSelection`

## 5. Known issue: legacy Gorhom padding workaround

`QueuedDrawerGorhom` applies a global `paddingHorizontal: 16` on the BottomSheetModal content container (see `combinedStyle` in `QueuedDrawerGorhom.tsx`). This causes list items to be misaligned with the header because items have their own internal padding on top of the drawer's padding.

**Temporary fix**: `LEGACY_LIST_STYLE` (`marginHorizontal: -16`) is applied to list components (`BottomSheetVirtualizedList`, `BottomSheetFlatList`) in `AssetSelection`, `NetworkSelection`, and `AccountSelection` when the Gorhom fallback is active. This cancels the drawer's padding so list items align correctly with the header/title.

**Also**: `SearchInputContainer` has a `withHorizontalPadding` prop used only in the Lumen path for `AssetSelection`, to match the `BottomSheetHeader`'s `spacing` (16px). In the Gorhom path, the drawer's global padding handles this.

All of this should be **deleted** when the Gorhom fallback is removed.

## 6. Remove @gorhom/bottom-sheet direct imports

After cleanup, verify no `@gorhom/bottom-sheet` imports remain in `src/` (only allowed in `__tests__/jest-setup.js` mock).

## 7. Delete this file

Remove `MIGRATION_CLEANUP.md` once cleanup is complete.
