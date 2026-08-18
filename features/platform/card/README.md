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

- `cardSession` — `set` / `get` / `clear` over the whole `PayCardSession` (both tokens and both
  lifetimes). Card Auth calls `set` when a login completes.
- `getCardSessionToken()` — reader passed to `cardApiExtra`; the shared base query awaits it before
  every request to attach `Authorization: Bearer`. It reads the access token key and nothing else.
- `refreshCardSession()` — refresh handler passed to `cardApiExtra`; the shared base query calls it
  once after a `401`.

## Where the session lives

| Platform | Store |
| --- | --- |
| Native | `react-native-keychain` — iOS keychain (`AFTER_FIRST_UNLOCK`), Android keystore (`AES_GCM_NO_AUTH`) |
| Web and desktop | renderer memory, for the life of the process |

Electron exposes no OS secret store in this repo, so a desktop restart asks for a new login. That is
the answer, not a shim: a Bearer credential must not join the persisted `payCard` slice (which stores
only `hasSeenFeatureTour` / `balanceFilter`).

The session occupies **three keys**, not one, because of the hot path: the base query reads the
access token before every Card request, and a single JSON blob would make it parse two JWTs the
request never needs. Each token therefore gets its own key, with the two lifetimes in a third.

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
`refreshCardSession`, which the base query calls on any Card `401`. Unqueued, a removal lands between
the two halves of a write and leaves the access token alone on disk, and a read pairs the previous
access token with the new refresh token.

`getCardSessionToken` never waits: one key cannot disagree with itself. During a write it answers the
previous access token, which stays valid until the new one lands, and the request path must not queue
behind a login.

`clear` never rejects. `isCleared` has already ended the session, so a removal the store refused leaves
nothing for the caller to handle.

## Status

`refreshCardSession` still clears the session and reports it cannot be renewed. The wire contract
exists (`refreshSession` in `@domain/api-card-management`), but the renewal itself is LIVE-34741.
