# OFAC requirements

## Sources

| Source | What it contributes |
| --- | --- |
| `libs/ledger-live-common/src/api/ofacGeoBlockApi.ts` and both apps' `AppGeoBlocker` | App-wide location block |
| Desktop `TriggerAppReady`, mobile `WaitForAppReady` and `LedgerStore` | What gates the splash |
| `OFAC_CURRENCIES`, `OFAC_FIAT_TICKERS`, `OFAC_LOCALES` | Hardcoded sanctions lists |
| `@domain/entity-currency-fiat` and `@domain/api-currency-fiat` | Supported-fiat list and the countervalue read path on mobile |
| `CurrencyRegionRestrictedError` and the desktop dialog / mobile drawer | Per-currency block |
| [LIVE-30604](https://ledgerhq.atlassian.net/browse/LIVE-30604) | Unavailable outcome for the location-check service at launch |

## Current behaviour

### 1. App-wide location block

Both apps ask the Countervalues Service whether the client is blocked, then either render the app or replace it with a full-screen block.

- Request: `GET {LEDGER_COUNTERVALUES_API}/v3/markets`.
- HTTP 200 means not blocked. HTTP 451 means blocked. Both count as a successful response. The query result is `true` only on 451.
- Any other outcome (network error, other status) leaves the result unset. The UI treats that as not blocked.
- No retry, no timeout, no refetch. The query is its own RTK Query api (`ofacGeoBlockApi`).
- The check starts when the blocker mounts. Desktop mounts it over the whole renderer tree. Mobile mounts it inside the loading gate, after the store is ready.
- Until the query has data, children still render. The block screen appears only after a 451.
- When blocked, children are not rendered. Copy is `geoBlocking.title` ("Location unavailable"), `geoBlocking.description` ("Ledger Wallet is not available in this location."), and Learn more, which opens the support article `Why Ledger Complies with Sanctions`.
- Desktop uses a link. Mobile uses a button. There is no second action. The block is not dismissible.

### 2. Launch gating

The location check does not hold the splash until the network answers.

**Desktop.** The splash hides when `appLoaded()` runs.

- `TriggerAppReady` calls it once the renderer is idle, capped at 3 seconds. It does not wait on the location check.
- `AppGeoBlocker` also calls it when `isLoading` becomes false, including on error and when blocked. A 451 dismisses the splash and shows the block screen.

A request that never settles does not keep the splash up. `TriggerAppReady` still fires.

**Mobile.** `LoadingApp` stays up in two stages:

- Until `LedgerStore` sets `ready`. Currency hydration runs after that and does not block render. `hydrateCurrencies` reads the local currency cache and does not call the location endpoint.
- Then `WaitForAppReady` keeps `LoadingApp` up until currency hydration has finished, the location query is not loading, and remote flags are ready. The wait is capped at 1 second. After the cap, children render even if the location query is still loading.

`AppGeoBlocker` on mobile does not read `isLoading`. Unknown data is not blocked.

### 3. Countervalue currency

A persisted countervalue whose ticker is sanctioned is read as USD. Storage is not rewritten.

| App | List | Fallback |
| --- | --- | --- |
| Desktop | `OFAC_CURRENCIES` (`@ledgerhq/live-common`) | USD |
| Mobile | `OFAC_FIAT_TICKERS` (`@domain/entity-currency-fiat`) | USD |

Both lists are AFN, BYN, CUP, CUC, IRR, IQD, KPW, RUB, SDG, SYP, MMK.

A fiat off that list still resolves from the registry when the offline supported-fiat fallback omits it. AMD is the regression case (LIVE-35110): it must stay AMD.

### 4. Supported fiat list

The picker list drops sanctioned tickers. This is separate from the read-time USD fallback.

- `@domain/entity-currency-fiat` builds `supportedFiats` from `FALLBACK_FIAT_TICKERS` with sanctioned tickers removed. RUB is in both and is removed.
- `@domain/api-currency-fiat` `getSupportedFiats` calls `GET /v3/supported/fiat`. `resolveSupportedFiats` drops sanctioned tickers, drops unknown tickers, and de-duplicates.
- A non-empty result replaces the slice. An empty payload is ignored, so a transient failure keeps the fallback. Either way, `fiatsReady` is set.
- The query starts from the countervalue pickers (desktop settings and market, mobile settings and market). It is not part of launch.

### 5. Desktop region locale

Desktop only. Mobile has no equivalent and still offers Russian (`ru-RU`).

`OFAC_LOCALES` in `apps/ledger-live-desktop/src/config/languages.ts`: `fa-AF`, `ps-AF`, `uz-AF`, `be-BY`, `es-CU`, `fa-IR`, `ar-IQ`, `ko-KP`, `ru-RU`, `nus-SD`, `ar-SD`, `ar-SY`, `fr-SY`, `my-MM`.

- The region picker omits those locales.
- A persisted locale on that list is read as `en-US` (`fa-AF` in tests).
- This filters the formatting locale (numbers and dates). The language list still includes `ru`. Russian as a language is allowed; the region locale `ru-RU` is not.

### 6. Per-currency region restriction

Separate from the app-wide screen. It runs while scanning accounts, not at launch.

- `getAccountShape` raises `CurrencyRegionRestrictedError` only when the coin config has `checkRegionRestriction: true` and the balance error status is 405.
- The only production opt-in is Hyperliquid (`config_currency_hypercore`).
- Desktop opens `CurrencyRegionRestrictedDialog`. Mobile opens `RegionRestrictedDrawer`.
- Both name the currency, offer Learn more (same sanctions article), and Close. Close returns the user to the app.
- A 500, a network error, or a missing config does not raise this error.

## New requirements (LIVE-30604)

Parent: [LIVE-36609](https://ledgerhq.atlassian.net/browse/LIVE-36609). Related: [TSD-9869](https://ledgerhq.atlassian.net/browse/TSD-9869), [TSD-10250](https://ledgerhq.atlassian.net/browse/TSD-10250).

The ticket's CAL is the Crypto Assets List service. It is not the Countervalues Service (CVS) that the location check calls. They are different backends and different outages. The CAL check is a separate probe from the location check.

Today the location check (CVS) fails open: anything other than 200 or 451 shows the app. The splash is already capped (desktop idle at 3 seconds, mobile at 1 second) and is not held for the network. Nothing probes CAL at launch.

Requested behaviour, both apps:

1. The location check keeps its behaviour and stays fail-open. HTTP 200 enters the app. HTTP 451 shows the location block, with its current copy and no exit. A CVS failure does not block the app.
2. A separate CAL check is fail-closed. If it fails, or has not succeeded when the splash cap fires, CAL is unavailable. Leave the splash and show a blocking error screen in place of the app.
3. Reuse the existing geo-block UI components for that screen. Copy and actions belong to the unavailable state, separate from the location-blocked copy.
4. A Try again button is the likely recovery. It re-runs the CAL check without restarting the app.

Not yet established: which CAL call actually holds users on the splash. It has not been reproduced. The probe's endpoint depends on that.

Design: [Figma, Home Production](https://www.figma.com/design/QZv5fm4oJ1GUS1iIUU8lJt/Home-Production-%E2%80%A2--Wallet-4.0?node-id=23505-84239).

