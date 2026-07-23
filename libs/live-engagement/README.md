# live-engagement

> [!CAUTION]
> **Status: UNSTABLE** — New engagement module under active development; API may evolve as use cases grow.

`@ledgerhq/live-engagement` holds shared Redux state for engagement surfaces (upsells, awareness modals, cooldown/frequency tracking) that more than one app needs, without growing `live-common` (frozen - see [libs/README.md](../README.md)).

## Scope

- **Belongs here**: platform-agnostic engagement state - slices, actions, selectors, and types. No React, no persistence.
- **Does not belong here**: persistence, UI, or analytics. Apps wire the reducer into their store and persist it via their own DB layer (`AsyncStorage`, `electron-store`, etc.).

## Exports

- `@ledgerhq/live-engagement/largeScreenUpsellModal` - reducer, actions, selectors, and state type for the app-start large-screen upsell modal's display/frequency tracking (`retries`, `lastSeenAt`).
