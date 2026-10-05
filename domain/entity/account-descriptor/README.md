# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** (account-\* PoC). New package, API still being designed.

The account descriptor: the minimal, hashable metadata that identifies an account, the same across its whole life (discovery on the device, use in the app, wallet sync, every account data source).

**ADR**: [Account descriptor as the common account identity](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity), built on the [Account descriptor ADR](https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/6975946770/ADR+-+Account+descriptor).

It replaces `AccountRef` of the earlier PoCs. It keeps out anything secret (Aleo view key), mutable (`freshAddress`) or server-assigned (Portfolio account UUID): that state lives next to the hash.

### String representation

```
account:1:<type>:<network_name>:<network_env>:<xpub_or_address>:<path>
```

| Field             | Values                                             |
| ----------------- | -------------------------------------------------- |
| `type`            | `utxo` (Bitcoin family) or `address` (EVM, Solana) |
| `network_name`    | `bitcoin`, `ethereum`, `solana`, …                 |
| `network_env`     | `main`, `testnet`, `devnet`, `goerli`, `sepolia`, … |
| `xpub_or_address` | xpub/ypub/zpub (UTXO) or derived address (ACCOUNT) |
| `path`            | BIP32 derivation path (see below)                  |

### Path conventions

**UTXO (`utxo` type)** — hardened segments only:

```
m/{purpose}'/{coin_type}'/{account_index}'
```

The non-hardened change/address suffix (`/0/0`) is intentionally omitted. The xpub already encodes the full derivation tree from the hardened account root, so the suffix is redundant.

| Derivation    | Purpose | coin_type (main/test) | Example       |
| ------------- | ------- | --------------------- | ------------- |
| legacy P2PKH  | 44      | 0 / 1                 | `m/44'/0'/0'` |
| segwit P2SH   | 49      | 0 / 1                 | `m/49'/0'/0'` |
| native segwit | 84      | 0 / 1                 | `m/84'/0'/0'` |
| taproot       | 86      | 0 / 1                 | `m/86'/0'/0'` |

**ADDRESS (`address` type)** — full BIP44 path including non-hardened components:

| Family   | Path template            | Example            |
| -------- | ------------------------ | ------------------ |
| EVM      | `m/44'/60'/{index}'/0/0` | `m/44'/60'/0'/0/0` |
| Solana   | `m/44'/501'/{index}'/0'` | `m/44'/501'/0'/0'` |

### Full examples

```
account:1:utxo:bitcoin:main:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84'/0'/0'
account:1:utxo:bitcoin:test:tpubD8Lg2gUVPCHWXFnFnqiKdPHZBVjGoMkL2YobGcqEUiE3K72TPFAG6Gjs1TK7d4yKnBqEhqawGXBpNxKzAYtSiRPBwwqvpyiNi4X6MHXTfHe:m/84'/1'/0'
account:1:address:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44'/60'/0'/0/0
account:1:address:solana:main:7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X:m/44'/501'/0'/0'
```

---

## Utilities

```ts
import {
  serializeAccountDescriptor,
  accountDescriptorKey,
  parseAccountDescriptor,
  accountKeyOf,
  currencyIdFromNetwork,
  networkFromCurrencyId,
} from "@domain/entity-account-descriptor";
```

- `serializeAccountDescriptor` / `parseAccountDescriptor`: the string form, as given.
- `accountDescriptorKey`: the identity of an account, and the input of its id hash (computed by `@domain/entity-account-alias`). Two spellings of one account (`'` or `h`, EVM checksummed or lowercase, network case) have the same key. Use it, not `serializeAccountDescriptor`, to compare, dedupe or key descriptors.
- `accountKeyOf`: the xpub of a `utxo` descriptor, the address of an `address` one.
- `currencyIdFromNetwork` / `networkFromCurrencyId`: the static network to currency table, built on the currency registry.
- `fromLegacyAccount` / `toLegacyAccount` are not here: they need the derivation schemes, so they live in `@ledgerhq/live-common/account-data/legacyAccount`.

## Limitations

- `freshAddress` is not part of the descriptor: it moves, and a descriptor must not.
- A currency the derivation registry cannot resolve throws `UnknownNetworkError` or `UnsupportedFamilyError`.
