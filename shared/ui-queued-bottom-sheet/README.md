# @shared/ui-queued-bottom-sheet

Shared queue-aware Lumen bottom sheet for React Native. Provides a single global FIFO queue so that only one sheet is ever open at a time, plus the Lumen `QueuedBottomSheet` UI that consumes it.

`QueuedBottomSheet` is the new Lumen-based component. The legacy `QueuedDrawer` (Flex/`react-native-modal`) stays in the app under `apps/ledger-live-mobile/src/mvvm/components/QueuedDrawer/` and is not part of this package.

Extracted so DDD feature packages can consume a queued bottom sheet within the micro-frontend boundary, instead of using Lumen `BottomSheet` directly or reaching into the app.

## Package layout

```
src/
  adapters.ts                 ← public adapter contract + defaults
  components/                 ← public UI (`index.native` + `QueuedBottomSheet.native`)
  contexts/                   ← public React contexts
  hooks/                      ← public hooks
  internals/                  ← package-private (not re-exported)
  testing/                    ← test double, exposed as `./testing` (see Testing)
  index.ts                    ← default stub (QueuedBottomSheet throws outside RN)
  index.native.ts             ← RN entry (unsuffixed imports; resolved via moduleSuffixes)
```

- `package.json` `exports` expose `"."` (`react-native` → `index.native.ts`), `"./testing"` and
  `"./testing/module-mock"`.
- RN-only package: `tsconfig.json` is platform-agnostic and `tsconfig.native.json` adds
  `moduleSuffixes: [".native", ""]`. There are no `.web` files or a web tsconfig.
- Barrels import unsuffixed paths (`./QueuedBottomSheet/QueuedBottomSheet`); `moduleSuffixes`
  (package `tsconfig.native.json` and LLM `tsconfig.json`) resolves `QueuedBottomSheet.native.tsx`.
- Avoid a same-basename `.ts` stub next to `*.native.tsx` (Rspack tries `.ts` before
  `.native.tsx`); keep the throw stub on the default `index.ts` only.
- Private helpers live in `internals/` and are tested there.

## Design: injected adapters

The package must not depend on `libs/*`, Redux, or React Navigation. App-specific behaviour is injected through a stable `QueuedBottomSheetAdapters` object passed to `QueuedBottomSheetsProvider`:

| Adapter                     | Purpose                                                                  | App implementation                       |
| --------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| `useAreBottomSheetsLocked`  | Hide the close button and block backdrop dismissal during device actions | `useSelector(isModalLockedSelector)`     |
| `useIsScreenFocused`        | Close/queue-cleanup when the owning screen loses focus                   | `useIsFocused` (React Navigation)        |
| `backgroundComponentByTone` | Status-tone gradient background for a sheet                              | `bottomSheetGradientByTone`              |
| `log`                       | Debug logging                                                            | `logDrawer` (env-gated `@ledgerhq/logs`) |

Adapters default to a no-op set (unlocked, focused, no gradient, no logging), so the package works without any wiring. Pass a **stable** adapters object (module scope or `useMemo`) — the adapter functions are called as hooks per sheet.

## Exports (native)

| Export                                                           | Description                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| `QueuedBottomSheet`                                              | Lumen bottom-sheet UI wired to the queue                            |
| `QueuedBottomSheetProps`                                         | Props for `QueuedBottomSheet`                                       |
| `QueuedBottomSheetsProvider`                                     | Mounts the queue and adapters; wrap the app once                    |
| `useQueuedBottomSheetContext`                                    | Access `addBottomSheetToQueue` / `closeAllBottomSheets`             |
| `IsInBottomSheetContext` / `IsInBottomSheetProvider`             | Know whether a subtree is inside a bottom sheet                     |
| `BottomSheetBackgroundContext`                                   | Descendants request a status-tone background                        |
| `useBottomSheetBackgroundTone`                                   | Descendants request a status-tone background on the enclosing sheet |
| `QueuedBottomSheetAdapters` / `defaultQueuedBottomSheetAdapters` | Adapter contract and defaults                                       |

## Usage

```tsx
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

<QueuedBottomSheet
  isRequestingToBeOpened={isOpen}
  onClose={close}
  enableDynamicSizing
>
  {content}
</QueuedBottomSheet>;
```

This package is React Native only. The default (non-`react-native`) export stub throws if `QueuedBottomSheet` is imported outside RN.

## Testing

The real sheet needs the queue and the adapters the app injects at its composition root, so a view
test can't render it. This package ships the double instead of each consumer hand-rolling one:

| Export                                      | Use                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `./testing`                                 | `QueuedBottomSheetMock`, `QUEUED_BOTTOM_SHEET_MOCK_TEST_ID`             |
| `./testing/module-mock`                     | Drop-in module replacement for a jest `moduleNameMapper`                 |

`features/flow/*` packages get it for free: `@support/jest-features-flow` maps the package to
`./testing/module-mock` in its native project, so their tests just render the view.

The double renders its children unconditionally — whether content shows while closed is the
consumer's decision, and the test should be able to assert it. It exposes open state through
`accessibilityState.expanded` (either `isRequestingToBeOpened` or `isForcingToBeOpened`), fires
`onOpened` when the sheet becomes open, and wires each close/back callback to a pressable derived
from the sheet `testID`: `-dismiss` → `onClose`, `-header-close` → `onHeaderClosePressed`,
`-backdrop` → `onBackdropPress`, `-back` → `onBack`. Sheets that pass no `testID` fall back to
`QUEUED_BOTTOM_SHEET_MOCK_TEST_ID`.

```tsx
render(<CardMoreSheet isSheetOpen onClose={onClose} />);

expect(screen.getByTestId("card-more-sheet").props.accessibilityState.expanded).toBe(true);
fireEvent.press(screen.getByTestId("card-more-sheet-dismiss"));
```

Only the sheet is replaced. A test that needs `QueuedBottomSheetsProvider`, the adapters or the
queue hooks — an app-level concern — should `jest.mock` the module itself.
