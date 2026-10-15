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
| `ServiceUnavailable` | Service-unavailable copy. Hosts render it when their splash cap wins while the CAL check is still pending. |
| `useAppAvailability` | Shared result for splash gates (`pending`, `available`, or `unavailable`). |
| `useOfacGeoBlockCheck` | OFAC check mapped to the availability vocabulary. |
| `useCalCheck` | CAL healthcheck mapped to the availability vocabulary. |
| `startCalHealthCheck` | Dispatches the CAL probe so hosts can overlap it with boot before splash gates mount. |
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

The probe reads `calServiceUrl` and `ledgerClientVersion` from the store `extraArgument` the host
already passes to `calApi`. Its fetch does not use the shared CAL base query, so that query's retry
does not apply. The flow does not choose a host.

Unavailable copy is resolved in the flow through `@shared/i18n`. Geo-block uses the existing
`geoBlocking.title`, `geoBlocking.description`, and `geoBlocking.learnMore` keys. Service-unavailable
uses `serviceUnavailable.title` / `serviceUnavailable.description`. The learn-more URL lives in the
flow (`urls.geoBlockLearnMore`) and opens through `@shared/linking`, so the host must mount
`AppAvailability` under `LinkingProvider`. The flow does not own the loading splash.

The CAL probe calls `GET {calServiceUrl}/v1/currencies?output=id&limit=1` with a 1s timeout
(aligned with the app splash wait) and sends `X-Ledger-Client-Version`. Hosts should call
`startCalHealthCheck` as soon as the store exists so the probe overlaps boot.

Desktop Playwright sets `PLAYWRIGHT_RUN` before the renderer boots. The health query then returns
`ok` and does not fetch, unless `CAL_HEALTHCHECK` is `failed`, which returns `failed`. Both are
read from `process.env` on that call. Jest does not set `PLAYWRIGHT_RUN`, so its handlers still
answer the probe.
