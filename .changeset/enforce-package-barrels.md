---
"@domain/api-currency-fiat": minor
"@domain/api-currency-token": minor
"@domain/api-swap-quotes": minor
"@domain/entity-account-name": minor
"@domain/entity-client-identity": minor
"@domain/entity-currency": minor
"@features/flow-contacts": minor
"@features/flow-contacts-add-contact": minor
"@features/flow-fear-and-greed": minor
"@features/flow-market-banner": minor
"@features/platform-aggregated-assets": minor
"@features/platform-contacts": minor
"@features/platform-currencies": minor
"@features/platform-env": minor
"@features/platform-style": minor
"@shared/api-services": minor
"@shared/auth": minor
"@shared/cloud-sync": minor
"@shared/cloud-sync-module": minor
"@shared/feature-flags": minor
"@shared/qr-code": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Make every new-architecture barrel a pure regrouping point, and enforce it.

An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
lines, plus an optional default re-export. Having to sort in the export
(`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
private `internals` location, and it may not re-export another workspace package.

That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
import paths and hid who actually provided it. Consumers now import the original provider and
declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
desktop app gains `@features/platform-contacts`.

Renamed or relocated, with the import specifier unchanged for consumers in every case except where
noted:

- `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
  `bulkSetAccountNames`, the name the slice actually defines.
- `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
  re-exporting a default under a different name.

Five packages are left untouched behind temporary exclusions, each recording how to remove it:

- `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
  barrel.
- the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
  `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
  team lands the change on its own schedule. Conformant barrels were prepared and verified for them
  before being reverted, so the work is deferred rather than open.
