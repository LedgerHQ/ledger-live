# @features/platform-card

> [!CAUTION]
>
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Cross-flow Card runtime. Owns the in-memory Card session and the Bearer/refresh accessors the app
injects into the shared `cardApi` service (`@shared/api-services`, `services/card`).

This lives in `features/platform` rather than `features/flow` because it is the seam between Card Auth
(which writes the session) and every authenticated Card use case (Management now; more later) — a
capability shared across flows, not one journey's internals.

## Public API

- `cardSession` — `set` / `clear` / `getToken` over the process-lifetime session token.
- `getCardSessionToken()` — reader passed to `cardApiExtra`; the shared base query calls it before
  every request to attach `Authorization: Bearer`.
- `refreshCardSession()` — refresh handler passed to `cardApiExtra`; the shared base query calls it
  once after a `401`.

## The session token is never persisted

The token is a Bearer credential and stays in module memory only. It must not join the persisted
`payCard` slice (which stores only `hasSeenFeatureTour` / `balanceFilter`).

## Status

Scaffold: `refreshCardSession` clears the session and reports it cannot be renewed, because there is no
refresh contract yet. Card Auth replaces it with a real renewal — and starts calling `cardSession.set`
on login — once it migrates onto `cardApi` (LIVE-33829). Hooks over `@domain/api-card-management` land
here alongside that work.
