# @shared/ui-app-unavailable

> [!CAUTION]
> **Status: UNSTABLE** — Wired through `@features/flow-app-availability`; its API may grow for other blocked states.

Full-screen blocked view for when Ledger Wallet cannot be used. The host supplies the copy and an
optional action. The same screen covers geo-block and service-unavailable. There is no query and no
i18n.

## Exports

| Export | Description |
| --- | --- |
| `AppUnavailable` | The blocked screen. Platform implementation picked automatically. |
| `AppUnavailableProps` | `title`, `description`, optional `action`, and optional `testID`. |
| `AppUnavailableAction` | Optional CTA: `label`, `onSelect`, and optional `testID`. |

## Usage

```tsx
import { AppUnavailable } from "@shared/ui-app-unavailable";

<AppUnavailable
  title="Ledger Wallet is currently unavailable"
  description="This does not impact your assets. Please try again later."
  action={{
    label: "Learn more",
    onSelect: () => openLink(learnMoreUrl),
  }}
/>
```

Wide layouts cap the column at 376px. Narrow layouts keep 16px side padding and let the
description wrap. The globe spot sits 24px above the copy, and the action sits 32px below that
block. When `action` is set, a gray large Lumen button with an external-link icon is shown, sized
to its label.

## Scope

Use it only for a full-screen block with no exit. A block inside a dialog or a bottom sheet uses
[`InfoState`](../ui-info-state) in that container instead, like
[`CurrencyRegionRestrictedDialog`](../../apps/ledger-live-desktop/src/mvvm/features/CurrencyRegionRestrictedDialog)
and
[`RegionRestrictedDrawer`](../../apps/ledger-live-mobile/src/mvvm/features/Accounts/components/RegionRestrictedDrawer).
