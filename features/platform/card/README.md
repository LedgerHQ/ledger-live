# @features/platform-card

> [!CAUTION]
>
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Cross-flow Card runtime. Owns the stored Card session and the three accessors the app injects into the
shared `cardApi` service (`@shared/api-services`, `services/card`).

This lives in `features/platform` rather than `features/flow` because it is the seam between Card Auth
(which writes the session) and every authenticated Card use case (Management now; more later) — a
capability shared across flows, not one journey's internals.

## The whole flow

```
authenticated request -> 401 -> one shared refresh -> persist rotated tokens -> replay once
```

Any failure while refreshing clears the session and publishes signed-out. A request whose session a
logout or newer login replaced answers a stale-request error instead and touches nothing.

## Public API

- `cardSession` — `set`, `get` and `clear` the two tokens.
- `readCardSession()` — returns the access token and its session id for the base query.
- `isCardSessionCurrent(sessionId)` — rejects responses from a replaced session before caching.
- `getCardSessionToken()` — returns the stored access token or `null`.
- `refreshCardSession(sessionId, failedAccessToken)` — renews after a 401.
- `configureCardSessionRenewal(config)` — installed once by each app store.

The refresh token has **no** public reader. It leaves this package only inside the grant request the
renewal sends.

## Where the session lives

Native stores each token in `react-native-keychain`. Web and desktop keep them in renderer memory,
so desktop requires a new login after restart. The old `lifetimes` slot is no longer read but is
still removed during cleanup.

## Safety model

- `set`, `get` and `clear` share a queue so a multi-key write cannot overlap a removal.
- A fail-closed flag hides credentials as soon as replacement or cleanup starts.
- Every login and logout increments a session id. Old work can neither overwrite nor clear the new
  session.
- Concurrent 401s for one token share a refresh. A different failed token waits and rechecks after
  the active refresh, avoiding two grants against a rotating refresh token.
- The access token is written last and removed first. Failed writes remove every session key.

## Renewal

Renewal starts only after an authenticated request returns 401. Success stores both rotated tokens
and replays once; a second 401 is returned to the caller. No expiry or clock is stored.

A new session written to storage is the only outcome that keeps the session. Any network, provider,
schema, token-read or write failure inside renewal clears it and publishes signed-out. This
deliberately signs users out during a token-endpoint outage in exchange for one recovery rule.

`session-replaced` is different: a newer login or logout already won, so the request returns
`card_stale_request` and leaves that session untouched. A keychain read rejection before the request
is reported without being mistaken for an absent session or clearing it.

## Credentials never travel through redux

The two OAuth2 grants are plain thunks in `@domain/api-card-management`: they dispatch no lifecycle
actions containing their credential arguments or token response. The Card base query also drops the
`Request` metadata whose headers contain the Bearer. This protects desktop support logs and the
mobile DevTools relay, which has no action sanitizer.

When renewal ends a session, apps publish signed-out immediately and reset the Card API cache one
macrotask later so the triggering request can return its 401. A successful replacement login resets
the cache after storage, and responses from older session ids are discarded.
