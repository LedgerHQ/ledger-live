# @shared/ui-info-state

> [!CAUTION]
> **Status: UNSTABLE** — New package; migrated from `apps/ledger-live-desktop` and
> `apps/ledger-live-mobile`, pending platform team review for API and placement.

Reusable "info state" layout for web (Desktop) and React Native (Mobile): a centered visual,
optional title/description, an optional banner, and up to two CTAs. Used for informational,
success, and error screens across both apps.

## Exports

| Export | Description |
| --- | --- |
| `InfoState` | The layout component. Platform implementation picked automatically. |
| `InfoStateProps`, `InfoStatePreset`, `InfoStateCta`, `InfoStateBanner`, `InfoStateSpotProps` | Component types. `InfoStateProps` and `InfoStateSpotProps` differ slightly per platform — see below. |
| `DialogBackgroundContext`, `DialogBackgroundToneProvider`, `DialogBackgroundGradient`, `useDialogBackgroundTone` | Web-only. Tints the enclosing dialog with a status gradient behind an `InfoState`. Not exported on the native build — Mobile uses `BottomSheetBackgroundContext` / `useBottomSheetBackgroundTone` from [`@shared/ui-queued-bottom-sheet`](../ui-queued-bottom-sheet) instead. |

## Platform differences

- **`content`** (a free-form node rendered between the copy and the banner) is web-only. Native
  has no equivalent slot.
- **`backgroundTone`** on the `spot` preset (an explicit dialog-tint override) is web-only.
- **`InfoStateSpotProps.size`** (custom Spot size for the `spot` preset) is web-only; native always
  renders the custom spot at the default size.

These mirror the two original implementations exactly — they are not new gaps introduced by this
migration.

## Usage

```tsx
import { InfoState } from "@shared/ui-info-state";

<InfoState
  preset="error"
  title="Something went wrong"
  description="Try again in a moment."
  primaryCta={{ label: "Retry", onPress: retry }}
/>
```

Web callers that want the dialog tinted with the InfoState's status tone wrap it in
`DialogBackgroundToneProvider`:

```tsx
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";

<DialogBackgroundToneProvider>
  <InfoState preset="error" title="Something went wrong" />
</DialogBackgroundToneProvider>
```
