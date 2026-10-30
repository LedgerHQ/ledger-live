# @shared/ui-animated-height

> [!CAUTION]
> **Status: UNSTABLE** — New package, extracted from the desktop Send flow.

Web only. `AnimatedHeight` wraps a dialog's content and animates the dialog's height whenever the content changes size, for example between the steps of a flow. Once the content is taller than the dialog's `max-height`, the height stops there and the content scrolls instead of being clipped.

## Usage

Put it directly inside the dialog content, whose `max-height` caps it. An optional `header` stays above the scrolling area.

```tsx
<DialogContent className="max-h-[90vh]">
  <AnimatedHeight header={<Header />}>
    <Step key={stepKey} />
  </AnimatedHeight>
</DialogContent>
```

A step that may outgrow the dialog reads `useAnimatedHeightCapped()` and makes itself scrollable while it's `true`:

```tsx
const isCapped = useAnimatedHeightCapped();

<div className={cn("flex flex-col", isCapped && "min-h-0 flex-1 overflow-y-auto")}>…</div>
```

## How it works

A `ResizeObserver` and a `MutationObserver` watch the content. `animatedHeightLayout.ts` measures it as stacked boxes, so a flex column stretched by the cap doesn't feed back into the measure, and ignores inputs and textareas, which resize themselves while typing.

## Used by

- The desktop Send flow (`apps/ledger-live-desktop/src/mvvm/features/Send`)
