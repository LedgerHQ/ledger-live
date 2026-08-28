# @features/platform-card

> [!CAUTION]
>
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Cross-flow Card runtime. Owns the stored Card session and the two accessors the app injects into the
shared `cardApi` service (`@shared/api-services`, `services/card`).

This lives in `features/platform` rather than `features/flow` because it is the seam between Card Auth
(which writes the session) and every authenticated Card use case (Management now; more later) — a
capability shared across flows, not one journey's internals.

## The whole flow

```
authenticated request -> 401 -> one shared refresh -> persist rotated tokens -> replay once
```

Any failure along that line — a store it cannot read, a grant the provider refuses, a body the schema
rejects, a write that fails — clears the session and publishes signed-out. A request whose session a
logout or a newer login replaced answers a stale-request error instead, and touches nothing.

## Public API

Every accessor is async, because the native store only reads asynchronously.

- `cardSession` — `set` / `clear` / `get` over the two tokens. `set` rejects with
  `CardSessionNotStoredError` when a logout or a newer login replaced the session first.
- `readCardSession()` — reader passed to `cardApiExtra`. It answers with the access token **and the
  id of the session it came from**, so the base query can name that session when it asks for a
  renewal. It reads, and nothing else.
- `getCardSessionToken()` — the access token on its own, for a caller that only asks "is there a
  session?".
- `refreshCardSession(sessionId)` — the one renewal entry, called by the base query on a `401`. It
  answers `refreshed`, `session-ended` or `session-replaced`.
- `configureCardSessionRenewal({ dispatch, onCardSessionEnded })` — installed once per store, at the
  app's composition root.

The refresh token has **no** public reader. It leaves this package only inside the grant request the
renewal sends.

## Where the session lives

| Platform        | Store                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Native          | `react-native-keychain` — iOS keychain (`AFTER_FIRST_UNLOCK`), Android keystore (`AES_GCM_NO_AUTH`) |
| Web and desktop | renderer memory, for the life of the process                                                        |

Electron exposes no OS secret store in this repo, so a desktop restart asks for a new login. That is
the answer, not a shim: a Bearer credential must not join the persisted `payCard` slice (which stores
only `hasSeenFeatureTour` / `balanceFilter`).

The session occupies **two keys**, one per token. `CARD_LEGACY_SESSION_KEYS` names the keys an
earlier build wrote and this one no longer reads; `removeSession` clears them too, so a logout or a
terminal cleanup takes them off the device. Every Card request reads the access token and nothing
else, so its own key keeps that path to one small value. The refresh token keeps its own key: the
request path never reads it, and the renewal reads nothing else.

Each key is a keychain `service` of its own — the only per-entry namespace the library offers. The
app password (see `AuthPass`) uses the default bundle-ID slot, so the two never collide. A wipe built
on `getAllGenericPasswordServices()` would take the session with it.

`AFTER_FIRST_UNLOCK` and `AES_GCM_NO_AUTH` state the same rule on each platform: no prompt, and a
value a background launch can read, but nothing before the first unlock after boot. The library
answers a refused write with `false` instead of a rejection, so the store raises it into one.

### The four mechanisms

Everything above is built on four, and only four:

**One queue.** `set`, `clear` and `get` take turns, because each one touches more than one key. Their
callers know nothing about each other: `set` runs from the login machine, and `clear` runs from
terminal cleanup, which the request path triggers. Unqueued, a removal lands between the two halves
of a write and leaves the access token alone on disk. The access token is written **last** and
removed **first**, so it exists only while the whole session does, and a write that fails at any
point removes every key it managed to store.

**A fail-closed `isCleared` flag.** Removals are best effort, so a locked keychain would leave a
cleared value readable. The flag is raised before the first removal and lowered by the next
successful write, and it keeps "cleared means no Bearer" true for the life of the process. A restart
reads the store again, and a token that outlived its session answers `401`, which clears it for good.
`clear` therefore never rejects: the session is already over.

**A session id.** Every login and every logout starts a new session and gives it a new id; a renewal
keeps the id, because it is the same session with a fresh token. A renewal reads the id before it
starts and compares it again before it writes or clears anything. **If the id moved, the renewal does
nothing.** Two bugs close on that one test: a renewal that began before a logout would put the
session back after it, and a renewal that failed for the user who just left would wipe the keychain
of the one who just arrived. The base query reads the id with the token and hands it back when it
asks for a renewal, so a request whose session was replaced in flight is never replayed with the new
user's token.

**One in-flight renewal promise, identity-checked.** All concurrent callers of the same session share
it. On mobile that is the main path, not an edge case: the common event is an app opened after more
than an hour away, where several screens fire Card requests against one expired token at once. The
identity check means a settling attempt never clears a newer one.

`getCardSessionToken` and `readCardSession` never take a turn: the access token is one key, and one
key cannot disagree with itself. During a write they answer the previous token, which stays valid
until the new one lands, and the request path must not queue behind a login.

## Renewal

A session is renewed **only after the provider has refused one**. The base query sends the request,
Baanx answers 401, `refreshCardSession()` renews, and the base query replays once. A second 401 is
the caller's answer.

The client renews nothing ahead of a failure, so nothing on disk records when a token expires and no
code reads a clock. Each renewal therefore costs one request that fails first, and an app opened
after an hour costs one such request per screen. This depends on the provider: a renewal starts only
on a **401**. If the provider answers any other status for an expired token, the client never renews.

### One outcome keeps the session

A renewal has exactly one good outcome: **a new session on disk**. Every other answer ends the
session and sends the user to the login screen.

| The renewal                                       | The session                        |
| ------------------------------------------------- | ---------------------------------- |
| a new session, written                            | renewed                            |
| any 4xx, any 5xx, a timeout, a lost connection    | **ends**                           |
| a 200 the wire schema rejects                     | **ends**                           |
| a store it could not read, or a write that failed | **ends**                           |
| the app never installed the renewal               | **ends**                           |
| a new login or a logout got in first              | kept — it belongs to somebody else |

Nothing reads a status, and nothing reads a body. The renewal is one `try` with one `catch`, and the
`catch` never inspects what it caught.

**This is a deliberate trade.** The alternative reads the OAuth2 error code (RFC 6749) and keeps the
session for every answer that does not name a dead grant: a 5xx, a proxy error page, a lost
connection. That is kinder to a user during a provider outage, but it leaves several ways for a
session to look alive and behave dead, and each one needs its own recovery path.

What one rule costs, and what was accepted with it:

- A Baanx outage on the token endpoint signs out every user who opens the app while it lasts.
- A wrong or missing `x-client-key` in a release (498, 499) does the same, although the credential on
  every device is still good.
- A user on a train, in a tunnel, is signed out by the lost connection.

What it buys: one rule, one recovery path, and no session that half works. The one line the renewal
writes with `console.warn` names the failure, so a support log still says which one it was.

The single answer that keeps the session is not a judgement about the credential. `session-replaced`
says a logout or a newer login got in first, so the session on disk belongs to somebody else. The
base query reports that as a `CUSTOM_ERROR`, **not** a 401, and the login flow leaves the session
alone.

The table above is about the renewal. On the request path itself, nothing ends a session by accident:
the native store rejects a read the OS refused rather than answering `null`, and the base query
reports that failure instead of sending a request with no Bearer. An absent session ends one, and a
locked keychain must not.

## Credentials never travel through redux

RTK Query dispatches an action for every phase of a request: `meta.arg.originalArgs` on the pending
one, and the answer on the fulfilled one. The desktop redux logger writes both into the file users
attach to a support ticket, in production. The mobile DevTools relay
(`@rozenite/redux-devtools-plugin`) sends both over a socket, and it takes **no** `actionSanitizer` —
its options carry `maxAge` and nothing else, and an enhancer cannot redact what an inner enhancer
receives. So a sanitizer cannot be the guarantee. The actions carry no credential instead:

| What handles a credential   | Why no action carries it                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| the two OAuth2 grants       | plain thunks in `@domain/api-card-management`, `grants.ts`. Dispatching one runs it and answers with the session; it dispatches nothing |
| every authenticated request | the Card base query drops `meta` altogether, so the `Request` whose headers hold the Bearer never reaches an action                     |

## Terminal cleanup and the request that triggered it

`cardApi.util.resetApiState()` aborts every running query, and the request whose 401 started the
renewal is one of them. An aborted request resolves from the uninitialized substate, so its
`unwrap()` answers `undefined` rather than throwing. Both apps therefore publish signed-out
synchronously and empty the Card cache **one macrotask later**, after the base query's 401 has
reached its caller.
