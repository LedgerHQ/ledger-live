---
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Add a `custom.bottomSheet.error` wallet-api method for the mobile Borrow Live App. The embedded webview can now open an error-toned bottom sheet that resolves with `{ confirmed: true }` when the CTA is pressed and `{ confirmed: false }` when the sheet is closed or dragged down, mirroring the `custom.dialog.confirmation` contract.

Shared param validation lives in `@ledgerhq/live-common/wallet-api/Borrow/errorBottomSheetParams`. On mobile the sheet is driven by a Redux Toolkit slice (`borrow.errorBottomSheet`) and a module-level resolver store, and its UI is rendered via the shared `InfoState` component with `preset="error"`, which both tints the parent `QueuedDrawerBottomSheet` with the error gradient (via `useBottomSheetBackgroundTone`) and renders the icon, title, description and CTA.

The legacy vanilla-redux `borrow` reducer (`actions/borrow.ts`, `BorrowActionTypes`) has been migrated to `createSlice`; the slice now exports `setInfoBottomSheet` and `setErrorBottomSheet` actions directly.
