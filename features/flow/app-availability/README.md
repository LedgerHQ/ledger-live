# @features/flow-app-availability

> [!CAUTION]
> **Status: STABLE** — Wired into Ledger Wallet Desktop and Mobile. 

Owns the launch availability check for Ledger Wallet. Apps wrap the tree with `AppAvailability`
and read `useAppAvailability` from splash gates. Unavailable states render
`@shared/ui-app-unavailable`.

The flow runs the OFAC geo-block check from `@domain/api-ofac` (fail-open on error) and a CAL
healthcheck (fail-closed on 5xx, timeout, or a URL that is not HTTP or HTTPS; fail-open as
`offline` / available when the device has no connectivity or the request never reaches the
service). The first unavailable check wins.

## Exports

| Export | Description |
| --- | --- |
| `AppAvailability` | Gate component. Available or pending renders children; unavailable renders the blocked view. |
| `useAppAvailability` | Shared result for splash gates (`pending`, `available`, or `unavailable`). |
| `useOfacGeoBlockCheck` | OFAC check mapped to the availability vocabulary. |
| `useCalCheck` | CAL healthcheck mapped to the availability vocabulary. |
| `AppAvailabilityStatus` | Discriminated union: `pending`, `available`, `unavailable` with reason. |

## Usage

```tsx
import { AppAvailability, useAppAvailability } from "@features/flow-app-availability";

<AppAvailability calServiceUrl={calServiceUrl} ledgerClientVersion={ledgerClientVersion}>
  <App />
</AppAvailability>
```

```ts
const availability = useAppAvailability(calServiceUrl, ledgerClientVersion);
const pendingAvailabilityCheck = availability.status === "pending";
```

Pass the CAL base URL and client version the host already injects into `calApi`. The flow does not
choose a host.

Unavailable copy is resolved in the flow through `@shared/i18n`. Geo-block uses the existing
`geoBlocking.title`, `geoBlocking.description`, and `geoBlocking.learnMore` keys. Service-unavailable
uses `serviceUnavailable.title` / `serviceUnavailable.description`. The learn-more URL lives in the
flow (`urls.geoBlockLearnMore`) and opens through `@shared/linking`, so the host must mount
`AppAvailability` under `LinkingProvider`. The flow does not own the loading splash.

The CAL probe calls `GET {calServiceUrl}/v1/currencies?output=id&limit=1` with a 1s timeout
(aligned with the app splash wait) and sends `X-Ledger-Client-Version`.
