# @domain/entity-contact

Domain entity for Contacts. It contains the minimal Zod-first model and mock factories required by the first mock-first Contacts flows.

## Scope

This package describes what Contacts flows manipulate:

- the default `Me` contact used by the `Me` screens;
- saved contacts;
- contact addresses with `currencyId`, `label`, and `address`.

`currencyId` is the id of the `CryptoOrTokenCurrency` selected by MAD. `address` is intentionally stored as a generic non-empty string because address parsing and currency-specific validation belong to flow or platform adapters. Asset names, tickers, icons, and network display data are also resolved later by those adapters.

It does not implement persistence, WalletSync, Ledger Sync, device actions, signer payloads, routing, Redux slices, or UI.

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

Mock factories are available for tests:

```ts
import { mockMeContact, mockContactWithMultipleAddresses } from "@domain/entity-contact/schema.mock";
```

## Testing

```sh
pnpm test
pnpm typecheck
```
