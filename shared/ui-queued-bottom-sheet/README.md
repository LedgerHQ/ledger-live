# @shared/ui-queued-bottom-sheet

> [!CAUTION]
> **Status: UNSTABLE** — New package; extracted from `ledger-live-mobile`, pending platform team review for API and placement.

Shared queue-aware Lumen bottom sheet for React Native. Provides a single global FIFO queue so that only one sheet is ever open at a time, plus the Lumen `QueuedBottomSheet` UI that consumes it.

`QueuedBottomSheet` is the new Lumen-based component. The legacy `QueuedDrawer` (Flex/`react-native-modal`) stays in the app under `apps/ledger-live-mobile/src/mvvm/components/QueuedDrawer/` and is not part of this package.

Extracted so DDD feature packages can consume a queued bottom sheet within the micro-frontend boundary, instead of using Lumen `BottomSheet` directly or reaching into the app.

## Package layout

```
src/
  adapters.ts                 ← public adapter contract + defaults
  components/                 ← public UI
  contexts/                   ← public React contexts
  hooks/                      ← public hooks
  internals/                  ← package-private (not re-exported)
  index.ts / index.native.ts  ← export * from adapters, components, contexts, hooks
```

- `package.json` `exports` expose only `"."`.
- Public modules are re-exported with `export *` only (no selective picking).
- Private helpers live in `internals/` and are tested there.

## Design: injected adapters

The package must not depend on `libs/*`, Redux, or React Navigation. App-specific behaviour is injected through a stable `QueuedBottomSheetAdapters` object passed to `QueuedBottomSheetsProvider`:

| Adapter | Purpose | App implementation |
| --- | --- | --- |
| `useAreBottomSheetsLocked` | Hide the close button and block backdrop dismissal during device actions | `useSelector(isModalLockedSelector)` |
| `useIsScreenFocused` | Close/queue-cleanup when the owning screen loses focus | `useIsFocused` (React Navigation) |
| `backgroundComponentByTone` | Status-tone gradient background for a sheet | `bottomSheetGradientByTone` |
| `log` | Debug logging | `logDrawer` (env-gated `@ledgerhq/logs`) |

Adapters default to a no-op set (unlocked, focused, no gradient, no logging), so the package works without any wiring. Pass a **stable** adapters object (module scope or `useMemo`) — the adapter functions are called as hooks per sheet.

## Exports (native)

| Export | Description |
| --- | --- |
| `QueuedBottomSheet` | Lumen bottom-sheet UI wired to the queue |
| `QueuedBottomSheetProps` | Props for `QueuedBottomSheet` |
| `QueuedBottomSheetsProvider` | Mounts the queue and adapters; wrap the app once |
| `useQueuedBottomSheetContext` | Access `addBottomSheetToQueue` / `closeAllBottomSheets` |
| `IsInBottomSheetContext` / `IsInBottomSheetProvider` | Know whether a subtree is inside a bottom sheet |
| `BottomSheetBackgroundContext` | Descendants request a status-tone background |
| `useBottomSheetBackgroundTone` | Descendants request a status-tone background on the enclosing sheet |
| `QueuedBottomSheetAdapters` / `defaultQueuedBottomSheetAdapters` | Adapter contract and defaults |

## Usage

```tsx
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

<QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={close} enableDynamicSizing>
  {content}
</QueuedBottomSheet>;
```

This package is React Native only. The default (non-`react-native`) export stub throws if `QueuedBottomSheet` is imported outside RN.
