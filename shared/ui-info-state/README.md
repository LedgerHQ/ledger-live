# @shared/ui-info-state

> [!CAUTION]
> **Status: UNSTABLE** — New package; migrated from `apps/ledger-live-desktop` and
> `apps/ledger-live-mobile`, pending platform team review for API and placement.

Reusable "info state" layout for web (Desktop) and React Native (Mobile): a centered visual,
optional title/description, an optional banner, and up to two CTAs. Used for informational,
success, and error screens across both apps.

## Exports

| Entry | Export | Description |
| --- | --- | --- |
| `@shared/ui-info-state` | `InfoState` | The layout component. Each app's bundler picks the `.web` or `.native` implementation. |
| `@shared/ui-info-state` | `InfoStateProps`, `InfoStateSpotProps`, `InfoStateSpotSize`, `InfoStateBackgroundTone` | The props contract, declared once in `InfoState.types.ts` for both platforms. |
| `@shared/ui-info-state` | `InfoStatePreset`, `InfoStateCta`, `InfoStateBanner`, `InfoStateBaseProps` | Types shared by every preset. |
| `@shared/ui-info-state/web` | `DialogBackgroundToneProvider` | Web only. Tints the enclosing dialog with the status gradient an `InfoState` requests. Import it from web code only: a `.web` file or the desktop app. |

On native, the enclosing bottom sheet takes the tone through `useBottomSheetBackgroundTone` from
[`@shared/ui-queued-bottom-sheet`](../ui-queued-bottom-sheet), so there is no native provider.

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

The status presets (`success`, `error`, `info`) tint the enclosing dialog or bottom sheet with
their tone. The `spot` preset tints it only when given a `backgroundTone`. On web, the dialog
draws the gradient when wrapped in `DialogBackgroundToneProvider`:

```tsx
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";

<DialogBackgroundToneProvider>
  <InfoState preset="error" title="Something went wrong" />
</DialogBackgroundToneProvider>
```
