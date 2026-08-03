# @features/flow-large-screen-upsell

> [!CAUTION] > **Status: UNSTABLE** — In active development as part of the large-screen upsell feature.

Eligibility + frequency-throttle decision for the large-screen upsell modal, plus the
portable modal UI (Lumen Dialog), content helpers, and feature-scoped display-frequency
state (schema, slice, selectors).

## Exports

- `largeScreenUpsellModalSlice` / selectors / actions — display-frequency state (`retries`, `lastSeenAt`, `session`)
- `getLargeScreenUpsellDecision` / `useLargeScreenUpsellDecision` — audience + cooldown + frequency
- `mapDevicesModelListToUpsellInputs` — `DeviceModelId[]` → decision inputs
- `buildLargeScreenUpsellCtaLink` / `buildLargeScreenUpsellContent` — pure helpers
- `LargeScreenUpsellModal` — Lumen Dialog (web) with mobile-matched copy/assets
- `LARGE_SCREEN_UPSELL_IMAGES` — light/dark hero webps
- `LargeScreenUpsellModalAnalyticsPorts` — optional viewed / CTA / dismiss callbacks for app-owned Segment

Apps wire theme + i18n + `openUrl` + analytics into the ViewModel, and register the slice in the app store.

Nothing inside `internal/` is exported.

## Testing

```sh
pnpm test
pnpm typecheck
```
