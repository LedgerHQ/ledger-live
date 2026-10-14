# @features/flow-app-availability

> [!CAUTION]
> **Status: UNSTABLE** — New package; not yet wired into a host application, and its API may change.

Owns the launch availability check for Ledger Wallet. Apps wrap the tree with `AppAvailability`
and read `useAppAvailability` from splash gates. Unavailable states render
`@shared/ui-app-unavailable`.

Today the flow runs the OFAC geo-block check from `@domain/api-ofac` (fail-open on error). A CAL
service-unavailable check will compose in later.

## Exports

| Export | Description |
| --- | --- |
| `AppAvailability` | Gate component. Available or pending renders children; unavailable renders the blocked view. |
| `useAppAvailability` | Shared result for splash gates (`pending`, `available`, or `unavailable`). |
| `useOfacGeoBlockCheck` | OFAC check mapped to the availability vocabulary. |
| `AppAvailabilityStatus` | Discriminated union: `pending`, `available`, `unavailable` with reason. |

## Usage

```tsx
import { AppAvailability, useAppAvailability } from "@features/flow-app-availability";

<AppAvailability>
  <App />
</AppAvailability>
```

```ts
const availability = useAppAvailability();
const pendingAvailabilityCheck = availability.status === "pending";
```

Unavailable copy is resolved in the flow through `@shared/i18n`. Geo-block uses the existing
`geoBlocking.title` and `geoBlocking.description` keys. The flow does not own URLs or the loading
splash.
