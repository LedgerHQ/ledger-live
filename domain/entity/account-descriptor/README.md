# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds it for the edges only.

## Edges only; hold the AccountUUID from `@domain/entity-account`

The `key` is sensitive: an xpub reveals the whole history of an account, an address is personal data. Code holds the `AccountUUID` of [`@domain/entity-account`](../account); only the edges import this package: the account data router (`domain/api/account-data`) and hooks (`features/platform/account-data`), the data sources (`features/platform/account-source-*`), discovery, the legacy bridge in live-common, `apps/wallet-cli` and `devtools/`. `@domain/entity-account` keeps it in `AccountEntry`; `features/flow/receive` still reads it until it moves to the `AccountUUID`. Show a key with `maskAccountKey` (`xpub6B…WNzh`), never in full.

What the rest of the code needs lives elsewhere:

| Need | Package |
| --- | --- |
| `AccountUUID`, `AccountUUIDSchema` | [`@domain/entity-account`](../account); `computeAccountUUID` in `@domain/entity-account/descriptor` |
| `NetworkId`, `Address`, the network bridges | [`@domain/entity-network`](../network) |
| `DerivationPath`, the legacy path bridges | [`@domain/entity-derivation`](../derivation) |

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
| `AccountDescriptorSchema` | zod union of `utxo` (xpub, hardened-only path) and `address` descriptors; `'` and `H` hardened markers are read as `h` |
| `serializeAccountDescriptor` / `parseAccountDescriptor` | `<purpose>:2:<type>:<network_id>:<key>:<path>`; a parsed descriptor always has `h` markers |
| `accountDescriptorKey` | canonical key: the serialized descriptor, normalized (see `key.ts`): `h` markers, lowercase network, lowercase `0x` address or hex public key |
| `maskAccountKey` | the one display form of a key or an address: `xpub6B…WNzh`; devtools only |
| `InvalidAccountDescriptorError` | thrown by `parseAccountDescriptor` |
