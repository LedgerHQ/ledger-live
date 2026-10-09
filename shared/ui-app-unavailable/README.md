# @shared/ui-app-unavailable

> [!CAUTION]
> **Status: UNSTABLE** — New package; not yet wired into a host application, and its API may change.

Full-screen blocked view for when Ledger Wallet cannot be used. The host supplies the copy.
The same screen covers geo-block and service-unavailable. There is no query, no i18n, and no
action.

## Exports

| Export | Description |
| --- | --- |
| `AppUnavailable` | The blocked screen. Platform implementation picked automatically. |
| `AppUnavailableProps` | `title`, `description`, and an optional `testID`. |

## Usage

```tsx
import { AppUnavailable } from "@shared/ui-app-unavailable";

<AppUnavailable
  title="Ledger Wallet is currently unavailable"
  description="This does not impact your assets. Please try again later."
/>
```

Wide layouts cap the column at 376px. Narrow layouts keep 16px side padding and let the
description wrap. The globe spot is fixed.
