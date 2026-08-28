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

- `cardSession` — `set` / `clear` / `get` over the two tokens. A whole `PayCardSession` satisfies
  `set`, so Card Auth hands one over unchanged when a login completes; the lifetime is not kept.
- `getCardSessionToken()` — reader passed to `cardApiExtra`; the shared base query awaits it before
  every request to attach `Authorization: Bearer`. It reads, and nothing else.
- `getCardRefreshToken()` — reader passed to `cardApiExtra` for the renewal endpoint, which takes no
  argument so that no token can become an RTK Query argument.
- `refreshCardSession()` — the one renewal entry, called by the base query on a `401`. It answers
  `refreshed` / `session-ended` / `unavailable`.
- `configureCardSessionRenewal({ dispatch, onCardSessionEnded })` — installed once, at the app's
  composition root.

## Where the session lives

| Platform | Store |
| --- | --- |
| Native | `react-native-keychain` — iOS keychain (`AFTER_FIRST_UNLOCK`), Android keystore (`AES_GCM_NO_AUTH`) |
| Web and desktop | renderer memory, for the life of the process |

Electron exposes no OS secret store in this repo, so a desktop restart asks for a new login. That is
the answer, not a shim: a Bearer credential must not join the persisted `payCard` slice (which stores
only `hasSeenFeatureTour` / `balanceFilter`).

The session occupies **two keys**, one per token. Every Card request reads the access token and
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
session also carries a **generation counter**, bumped synchronously by every `set` and `clear`. A
renewal reads it before it starts, and its write compares it again before it stores anything. Without
that, a renewal that began before a logout, and whose write landed after the clear, would bring the
session back to life.

`getCardSessionToken` never takes a turn: the access token is one key, and one key cannot disagree
with itself. During a write it answers the previous token, which stays valid until the new one lands,
and the request path must not queue behind a login.

`clear` never rejects. `isCleared` has already ended the session, so a removal the store refused leaves
nothing for the caller to handle.

## Renewal

A session is renewed **only after the provider has refused one**. The base query sends the request,
Baanx answers 401, `refreshCardSession()` renews, and the base query replays once. A second 401 is
the caller's answer.

Nothing is renewed ahead of a failure, so nothing on disk records when a token expires and no clock
is read. The cost is one doomed request per renewal, and on an app open after an hour one doomed
request per screen. The dependency, worth knowing: renewal starts only on a **401**. Any other status
for an expired token, and the client never renews.

All concurrent callers share one renewal promise. On mobile that is the main path, not an edge case:
the common event is an app opened after more than an hour away, where several screens fire Card
requests against one expired token at once.

HTTP 400 and 401 end the session, as do a missing refresh token and a write that fails after a
renewal. Everything else keeps it: 408, 429, 5xx, a transport failure, a store read failure, a
malformed answer, and an app that never installed the renewal. A nonterminal failure is **not**
remembered — the next 401 tries again, because it is the only way in.

> [!CAUTION]
>
> The mutation `configureCardSessionRenewal` dispatches **must** bypass Bearer injection
> (`extraOptions.authenticated: false` in `@domain/api-card-management`). A renewal that went through
> the authenticated path would answer 401, renew again, and loop.
