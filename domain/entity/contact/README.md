# @domain/entity-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Domain entity for Contacts. It contains the Zod-first model, Redux slice, selectors, and mock factories required by the first Contacts flows.

## Scope

This package describes what Contacts flows manipulate:

- the default `Me` contact used by the `Me` screens;
- saved contacts;
- contact addresses with `currencyId`, `label`, and `address`.
- local Contacts state and direct contact/address mutations.

`currencyId` is the id of the `CryptoOrTokenCurrency` selected by MAD. `address` is intentionally stored as a generic non-empty string because address parsing and currency-specific validation belong to later flow or integration adapters. Asset names, tickers, icons, and network display data are also resolved later by those adapters.

Address labels accept letters, numbers, punctuation, and spaces without a maximum length. The
domain validation helpers treat a blank draft as incomplete without surfacing an error and can
reject labels already used by the same contact. Duplicate comparison trims surrounding spaces,
normalizes Unicode, and ignores casing.

It does not implement persistence, WalletSync, Ledger Sync, device actions, signer payloads, routing, or UI.

## Usage

```ts
import { contact } from "@domain/entity-contact";

const ben = contact({
  id: "contact-ben",
  isMe: false,
  name: "Ben",
  addresses: [],
});
```

The `contactsSlice` and selectors are exported from the package root. Implementation files are
colocated directly in `src`. Address mutations accept the final `currencyId` selected by MAD; asset
and network display data are not stored in Contacts state.

Mock factories are available for tests:

```ts
import { mockMeContact, mockContactWithMultipleAddresses } from "@domain/entity-contact/schema.mock";
```

## Testing

```sh
pnpm test
pnpm typecheck
```
