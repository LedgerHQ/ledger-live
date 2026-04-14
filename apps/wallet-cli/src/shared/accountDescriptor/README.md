# Account Descriptor

This module defines two versioned representations of a Ledger account descriptor and the adapters to convert between them.

**ADR**: [ADR - Account descriptor](https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/6975946770/ADR+-+Account+descriptor)

---

## AccountDescriptorV0 — WalletSync (internal)

The V0 format comes from Ledger Wallet Sync / live-common. It is the format produced and consumed by live-common's `accountDataToAccount`, `decodeAccountId`, and the bridge stack.

```ts
{
  id:             "js:2:bitcoin:xpub6BosfCn...:native_segwit",
  currencyId:     "bitcoin",
  freshAddress:   "bc1q...",   // next unused address; "" when unknown
  seedIdentifier: "xpub6BosfCn...",
  derivationMode: "native_segwit",
  index:          0,
}
```

The `id` encodes `currencyId`, `seedIdentifier`, and `derivationMode` in the format `js:2:{currencyId}:{seedIdentifier}:{derivationMode}`. It is the primary key passed to the bridge.

### Supported derivation modes (Bitcoin family)

| `derivationMode`  | BIP44 purpose | Script type            |
| ----------------- | ------------- | ---------------------- |
| `""`              | 44            | legacy P2PKH           |
| `"segwit"`        | 49            | P2SH-wrapped segwit    |
| `"native_segwit"` | 84            | native P2WPKH (bech32) |
| `"taproot"`       | 86            | P2TR                   |

For EVM accounts `derivationMode` is `""` (standard BIP44) or `"ethMM"` (MetaMask-compatible). For Solana it is always `""`.

---

## AccountDescriptorV1 — ADR format

The V1 format is the canonical, human-readable descriptor defined in the ADR.

### String representation

```
account:1:<type>:<network_name>:<network_env>:<xpub_or_address>:<path>
```

| Field             | Values                                             |
| ----------------- | -------------------------------------------------- |
| `type`            | `utxo` (Bitcoin family) or `address` (EVM, Solana) |
| `network_name`    | `bitcoin`, `ethereum`, `solana`, …                 |
| `network_env`     | `main`, `test`, `dev`, `goerli`, `sepolia`, …      |
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
| EVM (MM) | `m/44'/60'/{index}'`     | `m/44'/60'/0'`     |
| Solana   | `m/44'/501'/{index}'/0'` | `m/44'/501'/0'/0'` |

The account index is always the third path segment (position `[2]` when split by `/`).

### Full examples

```
account:1:utxo:bitcoin:main:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84'/0'/0'
account:1:utxo:bitcoin:test:tpubD8Lg2gUVPCHWXFnFnqiKdPHZBVjGoMkL2YobGcqEUiE3K72TPFAG6Gjs1TK7d4yKnBqEhqawGXBpNxKzAYtSiRPBwwqvpyiNi4X6MHXTfHe:m/84'/1'/0'
account:1:address:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44'/60'/0'/0/0
account:1:address:solana:main:7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X:m/44'/501'/0'/0'
```

---

## Adapters

```ts
import { toV1, toV0, serializeV1, parseV1 } from "./index";
```

### `toV1(v0: AccountDescriptorV0): AccountDescriptorV1`

Converts a V0 descriptor to V1. Derives the type (`utxo` vs `account`) by checking whether `seedIdentifier` looks like an xpub (starts with `xpub`, `ypub`, `zpub`). Reconstructs the BIP32 path from `derivationMode` + `index`.

### `toV0(v1: AccountDescriptorV1): AccountDescriptorV0`

Converts a V1 descriptor back to V0. Recovers `derivationMode` and `index` from the path. Sets `freshAddress: ""` — if the fresh address is required, call `BridgeAdapter.getFreshAddress()` after syncing.

### `serializeV1(v1)` / `parseV1(str)`

Serialize a structured V1 object to its string form, or parse a V1 string back to a structured object.

---

## Limitations

- **`freshAddress` round-trip**: V1 does not store the fresh address. `toV0()` always returns `freshAddress: ""`.
- **Unsupported families**: Only `bitcoin`, `ethereum`, `solana` (and their known testnets) are mapped. Other currencies throw `UnsupportedFamilyError`.
- **EVM derivation modes**: Only `""` (standard BIP44) and `"ethMM"` (MetaMask) are handled. Uncommon modes (`"ethM"` legacy address-level index) are treated as `""`.
