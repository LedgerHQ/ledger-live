# Three high-level approaches for the OFAC migration

Working input for [LIVE-38470](https://ledgerhq.atlassian.net/browse/LIVE-38470), step 4.
Applies the placement in [relevant-architecture-guidance-for-ofac.md](./relevant-architecture-guidance-for-ofac.md) to the behaviour in [ofac-requirements.md](./ofac-requirements.md).

This note sets out three ways to finish the move and [LIVE-30604](https://ledgerhq.atlassian.net/browse/LIVE-30604). It does not pick one. That is the ADR (step 5). It does not split tasks (step 6).

## Held by every approach

These come from the placement note. An approach that drops one of them is a different design.

| Constraint | What it forces |
| --- | --- |
| The location check is an endpoint on `@domain/api-geo-block`, injected into `countervaluesApi` | No new `createApi`. No new reducer. `validateStatus` for 200 and 451 stays on this endpoint. Retry is opted out here. The URL comes from `cvsApiExtra`. |
| The launch screen is `@features/flow-app-geo-block`, with `.web` and `.native` beside each other | One move of the shared screen. Each app keeps the mount. The flow takes `onLearnMore` and copy from the app. |
| New packages do not import `libs/` | The flow cannot call `ofacGeoBlockApi` while it is being extracted. The endpoint exists before an app can mount the flow. |
| `ofacGeoBlockApi` is deleted when both apps have switched | Until the second app switches, the legacy api and the new endpoint both exist. A switched app does not import the legacy api. |
| Splash caps stay in the app | Desktop's 3 second idle cap and mobile's 1 second cap do not move into the flow. The app dismisses the splash when the flow reports an outcome. |
| Sanctioned tickers stay in `@domain/entity-currency-fiat` | Desktop's settings reducer stops reading `OFAC_CURRENCIES`. The live-common array is deleted when that reader is gone. This slice has no dependency on the gate. |
| Locales and the per-currency scan block stay where they are | `OFAC_LOCALES` stays in the desktop app. `CurrencyRegionRestrictedError`, the dialog, and the drawer stay on the account-scan path. |

Try again, if it is adopted, is a refetch on the unavailable state. It is not the shared base-query retry, and it does not restart the app. The unavailable state has its own copy and its own actions. The location-blocked state keeps `geoBlocking.title`, `geoBlocking.description`, Learn more, and no exit.

The Figma mock has no Try again button. The ticket asks to consider one. None of the approaches need that answer before the state exists. The button is a control on a state that already refetches.

## The fork

The two inputs disagree on the check behind the unavailable screen.

The requirements note treats the ticket's CAL as the Countervalues call the location check already makes. `GET /v3/markets` keeps its two successes (200 enters the app, 451 shows the location block). Any other outcome, or a check still pending when the splash cap fires, is the unavailable screen. There is no second probe.

The placement note treats that as unconfirmed. CAL being down and this Countervalues call failing are different outages until the launch path from [TSD-9869](https://ledgerhq.atlassian.net/browse/TSD-9869) is named. `hydrateCurrencies` reads a local cache and is not that path. A wrapper around `/v3/markets` would miss a different service.

Picking an approach resolves that disagreement. It also chooses when the fail-open rule ends. Today anything other than 451 renders the app.

## Approach A — Move the check, then change it

Ship the current rule in the new packages. Change the rule afterwards, on the same `/v3/markets` check.

1. Add `@domain/api-geo-block` with today's result: 200 is not blocked, 451 is blocked, anything else leaves the query unset.
2. Add the flow with today's screen. Children render unless the result is blocked. The flow reports settled, including on error, and the app calls `appLoaded` or ends `WaitForAppReady` from that report. Behaviour matches the apps now.
3. Switch each app's mount, in either order. Drop `ofacGeoBlockApi` from that app's store as it switches.
4. Delete `ofacGeoBlockApi` after the second app.
5. Change the endpoint's result to three outcomes, and add the unavailable state to the flow. A failed check, or one still pending when the app's cap fires, dismisses the splash into that state. Pending is the app reading the query at the cap. The endpoint does not invent a timeout.

The desktop ticker switch can land beside steps 1–4.

This keeps the placement note's rule that moving the component leaves fail-open in place. It takes the requirements note's reading of the check, so step 5 is the whole of LIVE-30604. Users keep today's splash behaviour until step 5.

The first version of the flow encodes a rule step 5 deletes. Splash wiring is touched twice: once to move `appLoaded` out of the component, again when failure becomes a screen.

## Approach B — Cut over with the new behaviour

The new packages are born with the three outcomes. Each app switches once. There is no release in which the new flow fail-opens.

1. Add `@domain/api-geo-block` whose result is not blocked, blocked, or failed. HTTP 200 and 451 are the two successes. Any other HTTP status or a network error is failed.
2. Add the flow with both blocking states. The location state has no exit. The unavailable state has its own copy and, if adopted, Try again.
3. Switch each app, in either order. The same change replaces `AppGeoBlocker`, removes `ofacGeoBlockApi` from that app's store, and dismisses the splash into the unavailable screen when the query has failed or is still pending at the cap.
4. Delete `ofacGeoBlockApi` after the second app.

The desktop ticker switch can land beside this.

This takes the requirements note's reading of the check and spends it on the first cutover. The placement note's "moving does not flip fail-open" applies to a move that preserves behaviour. This approach replaces the component with the new rule, so that sentence does not apply.

A defect in the new gate and a defect in the new rule ship together. Rollback reverts both. The migration cannot ship while LIVE-30604 is still open on the question of which service to call.

## Approach C — Migrate the location check, and probe CAL separately

Two tracks. The location check moves as it behaves today. LIVE-30604 waits until the launch call that stuck users on the splash is named, then becomes a second probe and a second state on the same flow.

Track 1 is steps 1–4 of approach A. Fail-open stays on `/v3/markets` after the move.

Track 2 starts when that launch call is named:

1. Add the probe as an endpoint injected into `calApi`. The package name follows the call. `@domain/api-currency-token` stays the asset catalogue.
2. Add the unavailable state to `@features/flow-app-geo-block`. The location state is unchanged.
3. Each app shows that state from the mount it already has, and dismisses the splash into it.

The desktop ticker switch can land beside track 1.

This keeps the placement note's caution. If the named call is `GET /v3/markets`, track 2 collapses into step 5 of approach A, and this approach becomes that one. Until then, the user-facing bug stays, and the repo grows a second launch query whose shape is still unknown.

## Comparison

| | A. Move, then change | B. Cut over with the new behaviour | C. Two probes |
| --- | --- | --- | --- |
| Check behind the unavailable screen | `/v3/markets` | `/v3/markets` | A CAL call, once named |
| When fail-open ends | A later change, after both apps have switched | At each app's switch | It stays on the location check. The new screen is a different query |
| Releases of the gate | Two | One | One for the move, one for the probe |
| LIVE-30604 can start | After the legacy api is deleted | With the first package | After the launch call is named |
| If the incident was a different service | The unavailable screen watches the wrong call | Same | The probe can follow the call |
| Rollback of the new rule | Reverts the second change. The new packages stay | Reverts the move as well | Reverts track 2. The moved location check stays |

## Ruled out

- Adding the unavailable screen or Try again to `ofacGeoBlockApi`, then extracting. `libs/ledger-live-common` takes no new features.
- Wrapping `ofacGeoBlockApi` from a new package. The legacy api is deleted, and new packages do not import it.
- A second `createApi` for the location check or for a CAL probe.
- Using the location-blocked copy and the no-exit behaviour for the unavailable state.
- Moving `OFAC_LOCALES` or the per-currency dialog and drawer into the launch flow.
- Holding the splash until the network answers. Both notes leave the caps in the app. The new screen replaces the splash when the cap fires on an unfinished check.

## Still open after an approach is chosen

- Whether Try again ships. The state can refetch either way.
- The unavailable copy. It is a different pair of strings from `geoBlocking.title` and `geoBlocking.description`.
- A second consumer of `OFAC_LOCALES`. Until one exists, the list stays in the desktop app.

Approach C also leaves the probe's URL and package name open. Approaches A and B close that by using `/v3/markets`.

## Out of scope for this note

No chosen approach, no ADR, and no task split. Those are steps 5 and 6.
