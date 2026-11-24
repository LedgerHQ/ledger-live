# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds it as a shared entity.

## Hold the AccountUUID; the descriptor stays at the edges

The `key` is sensitive: an xpub reveals the whole history of an account, an address is personal data, and some networks put more in it. Code holds the `AccountUUID`; only the edges read the descriptor: the account data router (`domain/api/account-data`) and hooks (`features/platform/account-data`), the data sources (`features/platform/account-source-*`), discovery, the legacy bridge in live-common, `apps/wallet-cli` and `devtools/`.

- The root entry exports what anyone may use: `AccountUUID`, `NetworkId`, `DerivationPath`, `Address`, the bridges, the errors, and `maskAccountKey`.
- `@domain/entity-account-descriptor/descriptor` exports the descriptor itself: its schemas and types, `parseAccountDescriptor` / `serializeAccountDescriptor`, `accountDescriptorKey` and `computeAccountUUID`.
- Show a key with `maskAccountKey` (`xpub6B…WNzh`), never in full.

## Format (version 2)

`<purpose>:2:<type>:<network_id>:<key>:<path>`

- `purpose`: `account` for a real account; `mock` for a generated one (`@devtools/mock-accounts`), which only the mock source serves. A mock and the real account it mirrors have different AccountUUIDs.
- `network_id`: the CAL network id (`bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`).

- `type`: the account model. `utxo`: the key is an xpub, the path is hardened up to the account. `address`: the path is the full path of the account's address.
- `key`: the public value the account is found and read from on its network. An xpub for `utxo`; for `address`, the address, or the public key (lowercase hex) when the address cannot give back what reading needs (Canton, Concordium, Internet Computer, TON, Aptos, Stacks), or the network account id (Hedera `0.0.x`).

A path is `m/` followed by indices below 2^31 without leading zeros; `'` and `H` are read as `h`.

```
account:2:utxo:bitcoin:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84h/0h/0h
account:2:address:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0
account:2:address:solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU:m/44h/501h/0h/0h
mock:2:address:ethereum:0x0000000000000000000000000000000000000001:m/44h/60h/0h/0/0
```

## Main exports

| Export | Role |
| --- | --- |
| `AccountDescriptorSchema` (`./descriptor`) | zod union of `utxo` (xpub, hardened-only path) and `address` descriptors; `'` and `H` hardened markers are read as `h` |
| `serializeAccountDescriptor` / `parseAccountDescriptor` (`./descriptor`) | `<purpose>:2:<type>:<network_id>:<key>:<path>`; a parsed descriptor always has `h` markers |
| `accountDescriptorKey` (`./descriptor`) | canonical key: the serialized descriptor, normalized (see `key.ts`): `h` markers, lowercase network, lowercase `0x` address or hex public key |
| `computeAccountUUID` (`./descriptor`; tests take the wrapper of `./schema.mock`) | uuid v5 of the canonical key; same on every device, carries no account key |
| `maskAccountKey` | the one display form of a key or an address: `xpub6B…WNzh` |
| `NetworkIdSchema` / `NetworkId` | branded network id; parsed and deserialized descriptors carry it |
| `AddressSchema` / `Address` | an address on a network, branded so analytics can refuse it |
| `DerivationPathSchema` | branded `DerivationPath`: a full BIP32 path, read with `h` hardened markers; a utxo descriptor path is one too, hardened only |
| `toDescriptorPath` / `fromDescriptorPath` / `LegacyDerivationPathSchema` | the only bridges from and to the legacy path spelling (`44'/60'/0'/0/0`) that ledgerjs signers and derivation schemes read |
| `toNetworkId` | a `NetworkId` from a string; throws `UnknownNetworkError` for an empty or malformed id |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | the only bridge between `NetworkId` and `CryptoCurrencyId` |

## NetworkId vs CryptoCurrencyId

A `NetworkId` names the chain a descriptor lives on; a `CryptoCurrencyId` (`@domain/entity-currency-crypto`) names a currency. Both are branded, so one cannot be passed for the other. They hold the same string for now, but `networkFromCurrencyId` and `currencyIdFromNetwork` are the only way to convert, and they throw `UnknownNetworkError` for an unknown id. Keep their call sites few: carry a `NetworkId` where code is about the network, and get a `NetworkId` from `NetworkIdSchema.parse` or a parsed descriptor.
