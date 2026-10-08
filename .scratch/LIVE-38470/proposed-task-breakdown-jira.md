# Proposed task breakdown (Jira task template)

- Issue type for all: Task
- Parent: [LIVE-36609](https://ledgerhq.atlassian.net/browse/LIVE-36609)
- Each task uses Why / What / How, plus Done when and Related issues.
- Related issues use Jira link types: "is blocked by" for hard dependencies, "blocks" for the inverse, "relates to" for soft links. Replace T-numbers with ticket keys once created.

---

## T1. Add `@domain/api-ofac`

**Why**
The OFAC location check lives in `libs/ledger-live-common/src/api/ofacGeoBlockApi.ts`, outside the new architecture, and apps register it as their own RTK reducer. It needs a domain package so the flow can consume it and the legacy api can go.

**What**

- New package `domain/api/ofac`, exporting a `useCheckQuery` hook that returns geo-blocked true or false and nothing else.
- Endpoint `check`, injected into `countervaluesApi` as `@domain/api-market-countervalues` does.
- No new `createApi`, no new reducer, no `domain/entity` package.
- Base URL from the `cvsApiExtra` the apps already pass. No `getEnv` inside the package.

**How**

- Scaffold from `domain/api/currency-fiat`, following `docs/new-library.md` (README status marker, `export *` barrel, `internals/`, knip script, changeset).
- `GET /v3/markets`, `validateStatus` for 200 and 451, transform to `status === 451`.
- Opt out of the shared base-query retry, as the current check does not retry.
- Tests: 200 gives false, 451 gives true, other status and network error are query errors, no retry.

**Out of scope**

- Wiring in and removing the old code is planned in other tickets

**Done when**
The package exports `useCheckQuery`, nothing under `shared/`, `domain/` or `features/` imports `ofacGeoBlockApi`, and the legacy api is untouched.

**Related issues**

- blocks: T3

---



## T2. Add `@shared/ui-app-unavailable`

**Why**
The geo-block screen is built on the `AppBlocker` shell in each app. The service-unavailable case needs the same screen. A shared pure view avoids a second copy per app.

**What**

- A pure view for both blocking cases, "geo-blocked" and "service unavailable". Props: title, description, learn-more action.
- No query, no i18n host, no `libs/` import.
- Replaces the `AppBlocker` shell for these two cases.

**How**

- `.web` and `.native` variants side by side. Mirror the current layouts (desktop link CTA, mobile button).
- May use `@shared/ui-info-state` internally if the designs allow.
- Figma: [https://www.figma.com/design/QZv5fm4oJ1GUS1iIUU8lJt/Home-Production-%E2%80%A2--Wallet-4.0?node-id=23505-84239&t=No3a29tnjrmnKAwi-1](https://www.figma.com/design/QZv5fm4oJ1GUS1iIUU8lJt/Home-Production-%E2%80%A2--Wallet-4.0?node-id=23505-84239&t=No3a29tnjrmnKAwi-1)
- Tests per variant: renders copy, learn-more fires.
- **Out of scope:** a retry button is a separate ticket

**Done when**
Both variants render with the current geo-block copy given as props

**Related issues**

- blocks: T3, T7, T15, T17
- relates to: T1 (independent)

---



## T3. Add `@features/flow-app-availability`

**Why**
The launch checks, the vocabulary for their results, and the blocking screen are split across both apps and duplicated. One flow should own them so each app only wires it in.

**What**

- `AppAvailability` component. Available renders children, unavailable renders `@shared/ui-app-unavailable`.
- `useAppAvailability` hook to share the result (available, and reason) with splash gates.
- `useOfacGeoBlockCheck` over `useCheckQuery` from `@domain/api-ofac`. Loading is `pending`, geo-blocked true is `unavailable` with reason `geoBlocked`, false or error is `available` (fail-open).
- `AppAvailability` type per the ADR: `pending`, `available`, `unavailable` with reason `geoBlocked` or `serviceUnavailable` and optional `retry`.
- Does not own `LoadingApp`, `MAX_WAIT`, or `appLoaded`.

**How**

- Takes `onLearnMore` and translated strings, or keys, from the app. Does not import `~/config/urls`, `~/renderer/linking`, or `libs/`.
- Port the cases from both existing `AppGeoBlocker` tests: not blocked, blocked, fail-open on error, undefined data, null and custom children.
- Follow Illustrative shape (simplified) below:

```ts
export type AppAvailability =
  | { status: "pending" }
  | { status: "available" }
  | { status: "unavailable"; reason: "geoBlocked" | "serviceUnavailable"; retry?: () => void }; 

export function useOfacGeoBlockCheck(): AppAvailability {
  const { data: geoBlocked, isLoading } = useCheckQuery(); // @domain/api-ofac
  if (isLoading) return { status: "pending" };
  // errors stay fail-open
  return geoBlocked ? { status: "unavailable", reason: "geoBlocked" } : { status: "available" };
}

// later: useCalCheck (fail-closed, "serviceUnavailable", retry = refetch)
```

Apps wrap the App with the flow component:

```tsx
import { AppAvailability } from '@featues/flow-app-availability'

<AppAvailability>
  <App />
</AppAvailability>
```

Apps control the loading splash with the flow hook

```ts
import { useAppAvailability } from '@featues/flow-app-availability'

// e.g.
const { pending: pendingAvailabilityCheck } = useAppAvailability();
const isLoading = pendingAvailabilityCheck && removeFlagsReady
```

**Done when**
The barrel exports the gate and hook, behaviour matches today's apps, and the flow is the only consumer of `@domain/api-ofac`.

**Related issues**

- is blocked by: T1, T2
- blocks: T4, T5, T10

---



## T4. Desktop: switch to the flow

**Why**
Desktop still mounts its own `AppGeoBlocker` against the legacy api. It has to move to the flow before the legacy api can be deleted.

**What**

- Replace `AppGeoBlocker` with the flow in `Default.tsx` (mount at lines 473 to 550).
- `appLoaded()` leaves the component. The app calls it when the flow reports a settled result (available, blocked, or errored).
- `TriggerAppReady` and its 3 second idle cap are unchanged.
- Remove `ofacGeoBlockApi` from the desktop store.

**How**

- Pass `onLearnMore` (`openURL` plus `useLocalizedUrl(urls.geoBlock.learnMore)`) and copy.
- Remove `ofacGeoBlockApi` from `renderer/reducers/rtkQueryApi.ts` and its test. Check the `countervaluesApi` wiring already covers the new endpoint.
- Delete the desktop `AppGeoBlocker` and its test (the file is `AppGeoblocker.test.tsx`, lowercase b). Leave `AppBlocker` while `AppVersionBlocker` uses it.

**Done when**
A 451 shows the same screen and copy, a failed check shows the app, the splash still lifts without waiting, and the desktop store has no `ofacGeoBlockApi`.

**Related issues**

- is blocked by: T3
- blocks: T6, T11, T17
- relates to: T5 (parallel)

---



## T5. Mobile: switch to the flow

**Why**
Mobile has the same legacy geo-block wiring, plus a view model and the splash wait. It has to move to the flow before the legacy api can be deleted.

**What**

- Replace `AppGeoBlocker` and `useAppGeoBlockerViewModel` in `src/index.tsx` (mount lines 427 to 437). Keep the order: `WaitForAppReady`, `AppProviders`, flow, `AppVersionBlocker`.
- `WaitForAppReady` reads `useAppAvailability` instead of `ofacGeoBlockApi.useCheckQuery`. It keeps `MAX_WAIT = 1_000` and the `LoadingApp` stages.
- Remove `ofacGeoBlockApi` from the mobile store.

**How**

- Pass `onLearnMore` (`Linking.openURL`) and copy.
- Remove `ofacGeoBlockApi` from `src/context/rtkQueryApi.ts` and its test.
- Delete the mobile `AppGeoBlocker`, view model, and test. Update `WaitForAppReady.test.tsx`.
- Add the 1 second timeout case to `WaitForAppReady.test.tsx`. It is not covered today.

**Done when**
Same as T4 on mobile, and the splash wait still caps at 1 second.

**Related issues**

- is blocked by: T3
- blocks: T6, T12, T17
- relates to: T4 (parallel)

---



## T6. Delete `ofacGeoBlockApi`

**Why**
Once both apps use the flow, the legacy api is dead code and should not stay as a second way to run the check.

**What**

- Remove `libs/ledger-live-common/src/api/ofacGeoBlockApi.ts`.
- Remove its line in `libs/ledger-live-common/.unimportedrc.json` and the doc comment in `shared/api-services/src/services/countervalues/constants.ts`.

**How**

- Add a changeset for `@ledgerhq/live-common`.
- Grep the repo for `ofacGeoBlockApi` before opening the PR.

**Done when**
Nothing in the repo references `ofacGeoBlockApi`.

**Related issues**

- is blocked by: T4, T5

---



## T7. Add a retry action to `@shared/ui-app-unavailable`

**Why**
The service-unavailable screen needs a retry, as the problem may be temporary. The geo-blocked screen must not have one, so the action is optional.

**What**

- Optional on-retry prop on both variants. Without it, no retry control renders.

**How**

- Extend the `.web` and `.native` variants from T2, using the existing button styles.
- Tests per variant: retry shown only when provided, and fires when pressed.

**Done when**
Both variants render a retry control only when a handler is given.

**Related issues**

- is blocked by: T2
- blocks: T10

---



## T8. Manually reproduce the CAL launch hang

**Why**
The CAL launch hang is confirmed, but the exact steps and the call that holds the app are not written down. T9 needs a named call to probe and T10 needs a scenario to automate. This can start now, in parallel with Part 1.

**What**

- Manual only. Block CAL on desktop and mobile. Record what the splash does and for how long.
- Name the launch call that holds the app.
- Write down the observed behaviour in LIVE-30604 and the ADR.

**How**

- Use a proxy, host block, or network throttling.
- Candidate call: `restoreTokensToCache` → `getTokensSyncHash` (`GET {CAL_SERVICE_URL}/v1/currencies?id=…`). It is conditional, sequential, and has no timeout.
- Record the exact steps, so the same scenario can be automated in T10.

**Done when**
The steps are written down and T9 has a named call to probe.

**Related issues**

- blocks: T9, T10
- relates to: LIVE-30604

---



## T9. Add the CAL probe domain API

**Why**
The unavailable state needs a signal for "CAL is down". `@domain/api-currency-token` is the asset catalogue and `getTokensSyncHash` has no timeout, so neither fits as a probe.

**What**

- New `@domain/api-cal`, a dedicated endpoint injected into `calApi`. No new `createApi`, no new reducer. `@domain/api-currency-token` stays the asset catalogue.
- Result: ok, failed, or offline.
- Fail-closed: a failed probe is reported as failed, never mapped to ok.
- Refetchable.

**How**

- Probe the call T8 named. Do not reuse `getTokensSyncHash`.
- Explicit timeout. No shared base-query retry.
- Online with 5xx or timeout is failed. A network error, or the OS reporting no connectivity, is offline and fails open.
- Tests: success, 5xx, timeout, offline.

**Done when**
The package exports a probe hook with the three results and the tests above pass.

**Related issues**

- is blocked by: T8
- blocks: T10

---



## T10. Add the unavailable state to the flow

**Why**
The flow only knows the geo-block reason today. The CAL probe needs to map to `serviceUnavailable`, with its own copy and an optional retry.

**What**

- `useCalCheck` over the T9 endpoint. Failure or timeout gives `unavailable` with reason `serviceUnavailable`. The first failing check sets the result.
- `retry` as a refetch of the probe, not the base-query retry. It does not restart the app.
- Own copy, separate from `geoBlocking.title` and `geoBlocking.description`. The copy is to be provided. Location-blocked keeps its copy and no exit.

**How**

- Add keys to both i18n catalogues and pass `lint:i18n-keys`.
- Tests: pending, available, unavailable with and without retry, retry recovers into the app, the two reasons render different copy.
- Automated check of the T8 hang scenario: with CAL blocked or never answering, the splash lifts into the unavailable screen within the cap instead of hanging. Use the scenario T8 wrote down. Mock the CAL endpoint at the network layer (MSW) for unit and integration level. Decide at step 7 whether it also needs a Playwright or Detox spec.

**Done when**
The flow returns `serviceUnavailable` for a failing probe, the screens differ per reason, and the hang scenario has an automated test.

**Related issues**

- is blocked by: T3, T7, T8, T9
- blocks: T11, T12

---



## T11. Desktop: show the unavailable screen and lift the splash

**Why**
With CAL down, desktop should lift the splash into an explanation instead of hanging.

**What**

- Compose `useCalCheck` into the flow's `results`.
- Lift the splash into the unavailable screen on failure, or when the check is still pending at the 3 second cap.

**How**

- The app reads the query at the cap. The endpoint does not invent a timeout.
- Verify manually with CAL blocked.

**Done when**
With CAL blocked, desktop reaches the unavailable screen within the 3 second cap.

**Related issues**

- is blocked by: T4, T10

---



## T12. Mobile: show the unavailable screen and lift the splash

**Why**
With CAL down, mobile should show an explanation instead of hanging. Today children render after the 1 second cap, so this changes that path.

**What**

- Compose `useCalCheck`. `WaitForAppReady` waits on its `pending` result, with the existing 1 second cap.
- On failure or pending at the cap, `LoadingApp` gives way to the unavailable screen.

**How**

- Update `WaitForAppReady.test.tsx`.
- Verify manually with CAL blocked.

**Done when**
With CAL blocked, mobile reaches the unavailable screen within the 1 second cap.

**Related issues**

- is blocked by: T5, T10

---



## T13. Move `OFAC_LOCALES` out of desktop config

**Why**
`OFAC_LOCALES` lives in `apps/ledger-live-desktop/src/config/languages.ts`. It filters the region picker (`RegionSelect.tsx`) and the persisted locale read (`reducers/settings.ts`). It is a legal restriction hidden in a language config file, and mobile has no equivalent.

**What**

- Give the constant one owner outside `config/languages.ts`, with the two consumers importing it from there.
- Keep the list identical. Leave the language list alone: `ru` stays, `ru-RU` stays excluded.

**How**

- Decide the home first: a desktop-local constant, or a package the flow or settings feature can import. Do not put it in `@features/flow-app-availability`, as it is not about app availability.
- Keep a test that a persisted `fa-AF` reads as `en-US`.

**Done when**
The constant has one owner outside `config/languages.ts` and both consumers import it from there.

**Related issues**

- relates to: T16 (same family of hardcoded restriction lists)

---



## T14. Sanctioned address screening: scope and plan

**Why**
Address screening is a different concern from the launch check, but it is part of the same legal-restrictions surface and sits outside the new architecture. It needs a plan before anyone moves it.

**What**

- Audit the consumers and list what a migration would touch: `useAddressValidation`, `AddressValidationError`, `contactsAddressValidationDependencies`, mobile `SanctionedAccountModal`.
- Output is a short plan and follow-up tasks, not code.

**How**

- Start from `libs/ledger-wallet-framework/src/sanction`. It is used by the Send recipient flow, Contacts, Receive, and the mobile Send and Receive screens.
- Check whether it should become a `domain/` or `features/` package, and which tests move with it.

**Done when**
A written plan exists, with a task for each consumer.

**Related issues**

- relates to: T16

---



## T15. Per-currency region restriction: align the dialog and drawer

**Why**
`CurrencyRegionRestrictedDialog` (desktop) and `RegionRestrictedDrawer` (mobile) show a similar blocking message to the app-wide screen. They may be able to share the view.

**What**

- Decide whether they can reuse `@shared/ui-app-unavailable` or only its pieces. They differ in one way: they have a Close action, the app-wide screen has no exit.
- If reuse fits, add the close action to the package as an optional prop. If it does not, record why and stop.

**How**

- They show when `getAccountShape` raises `CurrencyRegionRestrictedError` (405, `checkRegionRestriction: true`, only Hyperliquid today). Close returns the user to the app.
- Keep the 500, network error, and missing config cases raising nothing.

**Done when**
The decision is recorded, and any reuse keeps today's copy and the Close behaviour.

**Related issues**

- is blocked by: T2

---



## T16. Currency filter migration

**Why**
`OFAC_CURRENCIES` and `OFAC_FIAT_TICKERS` are hardcoded lists in `libs/ledger-live-common/src/currencies/support.ts`, re-exported from `currencies/index.ts`. Apps import the raw lists, so ownership and the update path are unclear.

**What**

- List every consumer in `apps/`, `libs/`, `features/`, `domain/` and `shared/`.
- Decide the target: move to a `domain/` package.
- Move behind one function, with the lists as internals.

**How**

- Tests: a sanctioned ticker is filtered, others pass.

**Done when**
No app imports the raw lists, and the owner package is named.

**Related issues**

- relates to: T13, T14

---

