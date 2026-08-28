# @features/platform-card

> [!CAUTION]
>
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Cross-flow Card runtime. Owns the stored Card session and the Bearer/refresh accessors the app
injects into the shared `cardApi` service (`@shared/api-services`, `services/card`).

This lives in `features/platform` rather than `features/flow` because it is the seam between Card Auth
(which writes the session) and every authenticated Card use case (Management now; more later) — a
capability shared across flows, not one journey's internals.

## Public API

Every accessor is async, because the native store only reads asynchronously.

- `cardSession` — `set` / `clear` / `get` over the two tokens. `set` rejects with
  `CardSessionNotStoredError` when a logout or a newer login replaced the session first.
- `readCardSession()` — reader passed to `cardApiExtra`. It answers with the access token **and the
  epoch of the session it came from**, so the base query can name that session when it asks for a
  renewal. It reads, and nothing else.
- `getCardSessionToken()` — the access token on its own, for a caller that only asks "is there a
  session?".
- `getCardRefreshToken()` — reader passed to `cardApiExtra` for the refresh grant, which takes no
  argument so that no token can become an RTK Query argument.
- `putCardAuthorizationGrant()` / `takeCardAuthorizationGrant()` / `receiveCardSession()` /
  `takeCardSession()` — the session hand-off. See **Credentials never travel through redux** below.
- `refreshCardSession(epoch)` — the one renewal entry, called by the base query on a `401`. It
  answers `refreshed` / `session-ended` / `session-replaced` / `unavailable`.
- `configureCardSessionRenewal({ dispatch, onCardSessionEnded })` — installed once per store, at the
  app's composition root. It answers with the call that uninstalls it again.

## Where the session lives

| Platform | Store |
| --- | --- |
| Native | `react-native-keychain` — iOS keychain (`AFTER_FIRST_UNLOCK`), Android keystore (`AES_GCM_NO_AUTH`) |
| Web and desktop | renderer memory, for the life of the process |

Electron exposes no OS secret store in this repo, so a desktop restart asks for a new login. That is
the answer, not a shim: a Bearer credential must not join the persisted `payCard` slice (which stores
only `hasSeenFeatureTour` / `balanceFilter`).

The session occupies **two keys**, one per token. `CARD_LEGACY_SESSION_KEYS` names the keys an
earlier build wrote and this one no longer reads; `removeSession` clears them too, so a logout or a
terminal cleanup takes them off the device. Every Card request reads the access token and
nothing else, so its own key keeps that path to one small value. The refresh token keeps its own key:
the request path never reads it, and the renewal endpoint reads nothing else.

Each key is a keychain `service` of its own — the only per-entry namespace the library offers. The
app password (see `AuthPass`) uses the default bundle-ID slot, so the two never collide. A wipe built
on `getAllGenericPasswordServices()` would take the session with it.

`AFTER_FIRST_UNLOCK` and `AES_GCM_NO_AUTH` state the same rule on each platform: no prompt, and a
value a background launch can read, but nothing before the first unlock after boot. The library
answers a refused write with `false` instead of a rejection, so the store raises it into one.

The access token is the only key the request path reads, so it is written **last** and removed
**first**. It therefore exists only while the whole session does. A write that fails at any point removes
every key it managed to store: the refresh token is a credential as much as the access token, and an
aborted login must not leave either behind.

A cleared session stops sending a Bearer even when the store refuses to forget. Removals are best
effort, so a locked keychain would leave the value readable — an in-memory flag, raised before the first
removal and lowered by the next successful write, closes that gap for the life of the process. A restart
reads the store again, and a token that outlived its session answers `401`, which clears it for good.

`set`, `clear` and `get` take turns on one queue, because each one touches more than one key. Their
callers know nothing about each other: `set` runs from the login machine, and `clear` runs from
terminal cleanup, which the request path triggers. Unqueued, a removal lands between the two halves
of a write and leaves the access token alone on disk.

A queue orders operations by the moment they were dispatched, not by what their callers meant. So the
session also carries a **generation counter**, bumped synchronously by every `set` and `clear`. This
counter is the session's identity, and the base query sees it as the `epoch` of a session snapshot.

A renewal reads the counter before it starts, and its write compares it again before it stores
anything. Without that, a renewal that began before a logout, and whose write landed after the clear,
would restore a session the user had ended.

The base query sends the epoch back when it asks for a renewal, and that closes two holes:

- a request whose session a **new login** replaced is answered `session-replaced`. It is never
  replayed with the new user's token.
- a **terminal** answer for that request clears nothing, because the session it belonged to is gone
  and the one on disk belongs to somebody else.

`getCardSessionToken` never takes a turn: the access token is one key, and one key cannot disagree
with itself. During a write it answers the previous token, which stays valid until the new one lands,
and the request path must not queue behind a login.

`clear` never rejects. `isCleared` has already ended the session, so a removal the store refused leaves
nothing for the caller to handle.

## Renewal

A session is renewed **only after the provider has refused one**. The base query sends the request,
Baanx answers 401, `refreshCardSession()` renews, and the base query replays once. A second 401 is
the caller's answer.

The client renews nothing ahead of a failure, so nothing on disk records when a token expires and no
code reads a clock. Each renewal therefore costs one request that fails first, and an app opened
after an hour costs one such request per screen. This depends on the provider: a renewal starts only
on a **401**. If the provider answers any other status for an expired token, the client never renews.

All concurrent callers share one renewal promise. On mobile that is the main path, not an edge case:
the common event is an app opened after more than an hour away, where several screens fire Card
requests against one expired token at once.

A session ends on HTTP 401, on a 400 whose body names a terminal OAuth2 grant error
(`invalid_grant`, `invalid_client`, `unauthorized_client`), and on a write that fails after a
renewal. Everything else keeps it: 408, 429, 5xx, a transport failure, a store read failure, a
malformed answer, a 400 with no grant error in it, and an app that never installed the renewal.

A 400 on its own is **not** enough. A proxy, a captive portal or a firewall answers the same status
with an HTML page, and so does a client-side mistake in the request body. Reading the grant error
code keeps those out of the terminal branch.

The base query answers a nonterminal failure with the original 401 and a body of
`card_renewal_unavailable`. The login flow reads that body and keeps the session, so a 5xx or a lost
connection on the token endpoint never signs a user out. A nonterminal failure is **not** remembered:
the next 401 tries again, because it is the only way in.

A store read that fails is not an empty store. The native store rejects such a read rather than
answering `null`, and the base query reports the failure. An empty store ends a session, and a
locked keychain must never end one.

## Credentials never travel through redux

RTK Query dispatches an action for every phase of a request: `meta.arg.originalArgs` on the pending
one, and the answer on the fulfilled one. The desktop redux logger writes both into the file users
attach to a support ticket, in production. The mobile DevTools relay
(`@rozenite/redux-devtools-plugin`) sends both over a socket, and it takes **no** `actionSanitizer` —
its options carry `maxAge` and nothing else, and an enhancer cannot redact what an inner enhancer
receives. So a sanitizer cannot be the guarantee. The actions carry no credential instead:

| What used to travel | Where it travels now |
| --- | --- |
| `exchangeAuthorizationCode`'s argument (the code and the PKCE verifier) | `putCardAuthorizationGrant()`, taken by the endpoint off `api.extra` |
| Either grant's answer (a whole session) | `receiveCardSession()`, read back with the handle the endpoint returns |
| `meta.baseQueryMeta.request` (whose headers hold the Bearer) | Dropped: the Card base query answers with a request URL, a method and a response status |

`redactCardApiAction` still runs on the desktop logger and the desktop DevTools. It is the second
control, and it also keeps Card user data out of a support log.

## Terminal cleanup and the request that triggered it

`cardApi.util.resetApiState()` aborts every running query, and the request whose 401 started the
renewal is one of them. An aborted request resolves from the uninitialized substate, so its
`unwrap()` answers `undefined` rather than throwing. Both apps therefore publish signed-out
synchronously and empty the Card cache **one macrotask later**, after the base query's 401 has
reached its caller.

> [!CAUTION]
>
> The mutation `configureCardSessionRenewal` dispatches **must** bypass Bearer injection
> (`extraOptions.authenticated: false` in `@domain/api-card-management`). A renewal that went through
> the authenticated path would answer 401, renew again, and loop.
