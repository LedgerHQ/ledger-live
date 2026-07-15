# @features/flow-large-screen-upsell

Eligibility + frequency-throttle decision for the large-screen upsell modal, plus the
portable modal UI (Lumen Dialog) and content helpers.

## Exports

- `getLargeScreenUpsellDecision` / `useLargeScreenUpsellDecision` — audience + cooldown + frequency
- `mapDevicesModelListToUpsellInputs` — `DeviceModelId[]` → decision inputs
- `buildLargeScreenUpsellCtaLink` / `buildLargeScreenUpsellContent` — pure helpers
- `LargeScreenUpsellModal` — Lumen Dialog (web) with mobile-matched copy/assets
- `LARGE_SCREEN_UPSELL_IMAGES` — light/dark hero webps

Apps wire theme + i18n + `openUrl` into the ViewModel.

Nothing inside `internal/` is exported.

## Testing

```sh
pnpm test
pnpm typecheck
```
