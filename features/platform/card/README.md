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
| Native | `expo-secure-store` — iOS keychain, Android keystore, `AFTER_FIRST_UNLOCK` |
| Web and desktop | renderer memory, for the life of the process |

Electron exposes no OS secret store in this repo, so a desktop restart asks for a new login. That is
the answer, not a shim: a Bearer credential must not join the persisted `payCard` slice (which stores
only `hasSeenFeatureTour` / `balanceFilter`).

The session occupies **three keys**, not one. `expo-secure-store` warns above 2048 bytes per value and
says it may throw in a later SDK, and two JWTs in one JSON blob can pass that limit. Each token
therefore gets its own key, with the two lifetimes in a third. It also makes the hot path cheap: the
base query reads one small key per request.

The access token is the only key the request path reads, so it is written **last** and removed
**first**. It therefore exists only while the whole session does. A write that fails at any point removes
every key it managed to store: the refresh token is a credential as much as the access token, and an
aborted login must not leave either behind.

A cleared session stops sending a Bearer even when the store refuses to forget. Removals are best
effort, so a locked keychain would leave the value readable — an in-memory flag, raised before the first
removal and lowered by the next successful write, closes that gap for the life of the process. A restart
reads the store again, and a token that outlived its session answers `401`, which clears it for good.

`set` and `clear` take turns on one queue. They have callers that know nothing about each other — `set`
runs from the login machine, `clear` runs from `refreshCardSession`, which the base query calls on any
Card `401`, outside React and outside the machine. Interleaved, a removal could land between the two
halves of a write and leave the access token alone on disk. Reads never wait for a turn: they cannot
break the invariant, and the request path must not queue behind a login.

`clear` never rejects, because the base query awaits `refreshCardSession` without a try/catch.

## Status

`refreshCardSession` still clears the session and reports it cannot be renewed. The wire contract
exists (`refreshSession` in `@domain/api-card-management`), but the renewal itself is LIVE-34741.
