# @domain/entity-large-screen-upsell-modal

Domain entity for the large-screen upsell modal's display-frequency state: how many times it has
been shown (`retries`) and when it was last shown (`lastSeenAt`).

## Scope

- the Zod-first `LargeScreenUpsellModalState` model;
- the `largeScreenUpsellModalSlice` (restore / record-display / reset-retries);
- selectors for `retries` and `lastSeenAt`.

It does not implement persistence, eligibility checks, throttling, or UI. It mirrors
`@ledgerhq/live-engagement`'s mobile slice (same state shape and action names) so a future
reconciliation pass can point mobile at this package with no behavioral change.

## Usage

```ts
import { largeScreenUpsellModalSlice, retriesUpsellModalSelector } from "@domain/entity-large-screen-upsell-modal";
```

## Testing

```sh
pnpm test
pnpm typecheck
```
