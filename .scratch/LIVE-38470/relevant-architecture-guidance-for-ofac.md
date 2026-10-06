# Relevant architecture guidance for OFAC

Working input for [LIVE-38470](https://ledgerhq.atlassian.net/browse/LIVE-38470), step 3.
Applies [new-architecture-guidance.md](./new-architecture-guidance.md) to the behaviours in [ofac-requirements.md](./ofac-requirements.md).

This note places each behaviour. It does not choose a migration sequence. That is step 4.

## Rules that bind this work

| Rule | Why it binds OFAC |
| --- | --- |
| Lowest layer that can own the concern | The location check, the ticker list, the launch screen, and the splash gate are different concerns. They do not share one package. |
| Reaching a backend stays in `@shared/api-services`. What you ask it for stays in `@domain/api-*` | Countervalues and CAL already have endpoint-less apis (`countervaluesApi`, `calApi`). A second `createApi` per check would add a second reducer, cache, and middleware for a backend that already has one. |
| `shared`, `domain`, and `features` do not import `libs/` | `ofacGeoBlockApi`, `OFAC_CURRENCIES`, and `CurrencyRegionRestrictedError` live in `libs/ledger-live-common` today. New packages take a contract of their own. Apps are the only place that may import both sides. |
| `libs/ledger-live-common` takes no new features | The CAL-unavailable check and the Try again action are new behaviour. They are not added to `ofacGeoBlockApi`. |
| One flow package per user-facing capability, with `.web` and `.native` beside each other | Desktop and mobile each have their own `AppGeoBlocker` and `AppBlocker`. The shared screen moves once. Each app keeps the mount. |
| Feature-scoped state stays in the flow. An entity is a business object with a schema | The location result is an HTTP status interpreted as a boolean. It is query data, not a slice. |
| App screens and splash timing stay in `apps/` | `TriggerAppReady` and `WaitForAppReady` are composition. A flow reports an outcome. The app decides when the splash ends. |
| `support/` is dev-only | No OFAC runtime code goes there. |

Rules from the guidance note that do not change a placement here: `domain/aggregate` (not a layer), the wiki's inverted "Forbidden" list (follow the repo), and the multi-entity data-layer skill (no OFAC response fans out into several entities).

`@domain/api-currency-fiat`'s README is stale on three points that would mis-place this work. Trust [ofac-requirements.md](./ofac-requirements.md) and the call sites: the client is connected, the sanctioned-ticker set lives in `@domain/entity-currency-fiat` (the api package imports it), and new Countervalues endpoints inject into `countervaluesApi` rather than calling `createApi` again. `features/platform/currencies` is a real package (currency runtime and hooks). It is not a stub, and it is not the home for a launch screen.

## Placement

### Location check

`GET {LEDGER_COUNTERVALUES_API}/v3/markets`, where HTTP 200 means not blocked and HTTP 451 means blocked.

| Piece | Home | Why |
| --- | --- | --- |
| Base URL, headers, default retry, reducer path | `@shared/api-services` `countervaluesApi` | Already how every other Countervalues use case reaches the service. |
| Endpoint, `validateStatus` for 200 and 451, transform to a boolean, cache tags, retry opt-out | A new `@domain/api-geo-block` package, injected into `countervaluesApi` | This is its own question of that backend. `@domain/api-currency-fiat` answers "which fiats are supported". `@domain/api-market-countervalues` answers "what are the rates". |
| Reducer registration | Each app's existing `countervaluesApi` store wiring | `injectEndpoints` mutates that api. There is no `ofacGeoBlockApi` reducer to add. |
| Entity package | None | Nothing is persisted, mocked as a domain object, or selected from a slice. The query result is the boolean. |

`validateStatus` belongs on this endpoint's query args. `FetchArgs` already accepts it, and the shared base query forwards those args. The shared Countervalues base query stays a pure transport: other endpoints still treat 451 as a failure.

The shared base query retries. The current check does not. The endpoint sets `extraOptions` to opt out, the same way `@domain/api-market-countervalues` does for calls that must not retry. Changing the shared retry default would change every Countervalues use case.

`ofacGeoBlockApi` in `libs/ledger-live-common` is the code this replaces. It also reads `getEnv("LEDGER_COUNTERVALUES_API")` inside the api. The new endpoint reads the URL from the `cvsApiExtra` the app already passes. The domain package owns no env lookup.

### Sanctioned fiat tickers and the supported-fiat list

| Piece | Home | Why |
| --- | --- | --- |
| Ticker set (`AFN`, `BYN`, `CUP`, `CUC`, `IRR`, `IQD`, `KPW`, `RUB`, `SDG`, `SYP`, `MMK`) | `@domain/entity-currency-fiat` `OFAC_FIAT_TICKERS` | Already the domain object. Desktop still reads `OFAC_CURRENCIES` from `@ledgerhq/live-common`. That call switches to the entity set. |
| Read-time substitution (a persisted sanctioned ticker is read as USD; storage is not rewritten) | A pure function next to that set, in `@domain/entity-currency-fiat` | Both settings reducers apply the same rule. It needs no network and no React. The reducers in each app keep owning persistence. |
| Dropping sanctioned tickers from the list the user can pick | Stays in `@domain/api-currency-fiat` `resolveSupportedFiats` and the entity's `buildFallbackFiats` | Already placed. Not part of launch. |

No third copy of the set. The live-common array remains until desktop's settings reducer is the last reader, then it goes away with that reader. New code does not add a writer on the legacy side.

### Desktop region locales

`OFAC_LOCALES` stays in `apps/ledger-live-desktop/src/config/languages.ts`.

One app reads it. Mobile has no equivalent filter and still offers Russian. The list is a formatting-locale filter for the desktop region picker, not a currency entity and not a second consumer of the ticker set. A package for one call site fails the "lowest layer that earns its keep" test. A second consumer would reopen this.

### Launch screen

The location-blocked screen is one user-facing capability used by both apps: same copy (`geoBlocking.title`, `geoBlocking.description`), same support article, no dismiss path.

| Piece | Home | Why |
| --- | --- | --- |
| Screen, view / view-model, `.web` and `.native` variants | `@features/flow-app-geo-block` | Business-aware UI shared by both apps. Variants live beside each other. The flow depends on `@domain/api-geo-block` for the query. |
| Design-system widgets (desktop link, mobile button), copy, Learn more | Inside that flow, per variant | These are the screen, not app composition. |
| Mounting the gate over the tree | Each app | Screen composition and the decision to wrap the whole tree stay in the app. |
| Opening the support URL, i18n host | The app passes them in | Linking and locale catalogues differ by app. The flow takes `onLearnMore` and already-translated strings, or keys the app's i18n provides. It does not import `~/config/urls` or `~/renderer/linking`. |
| `AppVersionBlocker` | Stays where it is | A different product case. It shares a shell today only by sitting in the same app folder. |

Anything left inside an app stays under `src/mvvm/`. The flow's public barrel exports the gate component and nothing from `live-common`.

The current components render children whenever the query has no data, and replace them only after a 451. That fail-open rule is the flow's behaviour. Moving the component does not flip it to fail-closed.

### Splash and launch gating

Stays in each app.

| App | Owner today | What moves |
| --- | --- | --- |
| Desktop | `TriggerAppReady` (renderer idle, 3 second cap) and the `appLoaded()` call inside `AppGeoBlocker` | `appLoaded()` leaves the flow. The app calls it when the gate reports settled (ready, blocked, or failed). The idle cap stays an app policy. |
| Mobile | `WaitForAppReady` (currency hydration, location query not loading, remote flags, 1 second cap) | The wait stays in the app. The flow does not own `MAX_WAIT` or `LoadingApp`. |

[LIVE-30604](https://ledgerhq.atlassian.net/browse/LIVE-30604) asks to leave the splash and show a screen. Leaving the splash is an app change. Showing the screen is the flow.

### CAL unavailable at launch

A separate behaviour from the location check, until someone confirms they are the same outage. The location check calls Countervalues and fails open. CAL being down is not on that path. Implementing the new requirement as a wrapper around `/v3/markets` would miss both the service the ticket names and the fail-open rule the code has.

| Piece | Home | Why |
| --- | --- | --- |
| Reaching CAL | `@shared/api-services` `calApi` | Already the CAL transport. |
| The probe ("is CAL unavailable right now") | A new endpoint on a `@domain/api-*` package injected into `calApi`, once the signal is confirmed | `@domain/api-currency-token` is the asset catalogue. A launch health check is a different question of the same backend. The package name waits on what the probe actually calls. |
| The screen | A second state of `@features/flow-app-geo-block` | Both apps show it at the same mount as the location block, and the ticket asks to reuse that screen where it fits. |
| Copy, exit, and retry | Separate from the location-blocked state inside that flow | Location blocked means "this location cannot use the app" and has no exit. CAL unavailable means "a check did not complete". If Try again lands, that state must be able to continue into the app. |
| Try again | The flow's action, calling the probe's refetch | User-initiated. It is not the shared base-query retry, and it does not restart the app. Whether the control exists is still open (the ticket asks to consider it; the Figma comment says the mock has no such button). The layer does not depend on that answer. |
| Splash dismissal on this failure | The app | Same split as the location check. |

No `@features/platform-*` package. Platform is for a hook several flows share. Launch is the only consumer of either check. The per-currency block below is a different mechanism and does not read this probe.

### Per-currency region restriction

This runs during account scan, not at launch. The only production opt-in is Hyperliquid (`checkRegionRestriction` on `config_currency_hypercore`). A balance failure becomes `CurrencyRegionRestrictedError` only for HTTP 405 when that flag is set. The dialog and drawer are dismissible and name the currency.

| Piece | Home | Why |
| --- | --- | --- |
| `isRegionRestrictedFailure` and the throw inside `getAccountShape` | Stays in `libs/ledger-live-common` generic coin framework | The account bridge is not migrating in this work. New-arch packages cannot import it, and this ticket does not pull `getAccountShape` into `domain/`. |
| Coin opt-in | Stays on the coin config | One coin opts in. The flag is coin configuration, not an app concern. |
| Desktop `CurrencyRegionRestrictedDialog` and mobile `RegionRestrictedDrawer` | Stay in each app's scan feature | They are steps of account scan, which still lives in the apps. Extracting them into `@features/flow-app-geo-block` would mix a dismissible scan error with the launch gate. |
| If a later migration moves the scan UI | The scan flow takes `currencyName`, `onClose`, and `onLearnMore` as props | The app maps the legacy error onto those props. The flow does not import `CurrencyRegionRestrictedError`, and no new-arch barrel re-exports it. |

## Legacy frontier

For each extracted piece, in the order the architecture already prefers:

1. The flow and the api packages declare their own props and query result. Apps pass URL openers, translated copy, and splash callbacks in.
2. Store registration, mounting the gate, and splash policy stay in the app composition root, which is allowed to import `libs/` and the new packages in the same file.
3. Legacy modules are not given a dependency on the new packages. Desktop settings stops importing `OFAC_CURRENCIES` by calling the entity instead. That import direction (app → entity) is already allowed.

`ofacGeoBlockApi` is deleted from `live-common` when both apps have switched, not wrapped. Nothing in `shared/`, `domain/`, or `features/` imports it during the move.

## Ruled out

- A new `createApi` for the location check, or for the CAL probe.
- Folding the location endpoint into `@domain/api-currency-fiat` or `@domain/api-market-countervalues`.
- An entity package whose only value is `boolean`.
- Putting the CAL probe or Try again into `libs/ledger-live-common`.
- A `features/platform` package with a single launch consumer.
- One screen state that uses the location-blocked copy and the no-exit behaviour for a CAL outage.
- Re-exporting `CurrencyRegionRestrictedError` from a new-arch barrel.
- Treating `@domain/api-currency-fiat`'s README as the placement source for this work.

## Open questions that still affect placement

- **What the CAL probe calls.** The layer (an endpoint injected into `calApi`) holds. The package name and the query do not, until the launch path that actually stuck users on the splash is identified. `hydrateCurrencies` reads a local cache and is not that path.
- **Try again.** Decides whether the CAL state has a refetch action. It does not move that state to another layer.
- **A second consumer of `OFAC_LOCALES`.** Until one exists, the list stays in the desktop app.

## Out of scope for this note

No migration sequence, no ADR, and no task split. Those are steps 4 to 6.
