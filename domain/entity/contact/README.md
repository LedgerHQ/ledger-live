# @domain/entity-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Domain entity for Contacts. It contains the Zod-first model, Redux slice, selectors, and mock factories required by the first Contacts flows.

## Scope

This package describes what Contacts flows manipulate:

- the structural `Me` contact used by the `Me` screens;
- saved `ContactGroup` contacts with synchronized identifiers;
- `ExternalAddress` records with `currencyId`, `label`, `address`, and device context.
- local Contacts state and direct contact/address mutations.

`currencyId` is the id of the `CryptoOrTokenCurrency` selected by MAD. `address` is intentionally stored as a generic non-empty string because address parsing and currency-specific validation belong to later flow or integration adapters. Asset names, tickers, icons, and network display data are also resolved later by those adapters.

Contact names and address labels are limited to 32 characters. Address labels must contain at least
one letter or number and may also include punctuation and spaces. The domain validation helpers
treat a blank draft as incomplete without surfacing an error and can reject labels already used by
the same contact. Input schemas trim surrounding whitespace and normalize Unicode NFC before
validation. Duplicate comparison ignores casing.

Each contact with one or more addresses carries `deviceCredentials` returned by Device Intents.
Each address carries its own device context: `blockchainFamily`, `chainId`, and `hmacRest`.
Empty contacts can be renamed or removed locally. Device Intents are required to add an address,
rename a contact with an address, or modify an address label or value.

It exposes a Cloud Sync module with a stable Contacts document: `{ me, contactGroups }`. `Me` has
no remote identifier; the local-only `Me` identifier and `isMe` flags are reconstructed when
incoming data is applied. Contact group and address identifiers, device credentials, and device
context are synchronized. The module preserves unknown future fields when a client changes known
Contacts data. Registering the module in Wallet Sync and persisting Contacts alongside its sync
metadata are app-integration responsibilities and remain separate from this entity package.
Registration requires Wallet Sync module isolation so an invalid Contacts payload is quarantined
without stopping the other modules.

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
