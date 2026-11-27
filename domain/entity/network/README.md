# @domain/entity-network

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The network an account lives on, and an address on it. Any code may use it; an account descriptor carries a `NetworkId`, but the descriptor itself stays at the edges (see [`@domain/entity-account-descriptor`](../account-descriptor)).

## Main exports

| Export | Role |
| --- | --- |
| `NetworkIdSchema` / `NetworkId` | branded CAL network id (`bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`) |
| `toNetworkId` | a `NetworkId` from a string; throws `UnknownNetworkError` for an empty or malformed id |
| `networkFromCurrencyId` | build a `NetworkId` from a known `CryptoCurrencyId` (legacy / CAL currency → descriptor) |
| `currencyIdFromNetwork` | **deprecated** — legacy reconciliation only (see below) |
| `AddressSchema` / `Address` | an address on a network, branded so analytics can refuse it |
| `UnknownNetworkError` | thrown for an unknown or malformed network id |

## NetworkId vs CryptoCurrencyId

A `NetworkId` names a chain; a `CryptoCurrencyId` (`@domain/entity-currency-crypto`) names a currency. Both are branded, so one cannot be passed for the other. They hold the same string for now, but only `networkFromCurrencyId` and `currencyIdFromNetwork` convert, and they throw `UnknownNetworkError` for an unknown id.

Carry a `NetworkId` where code is about the network. Prefer `NetworkIdSchema.parse` / `toNetworkId`, or a parsed descriptor's `network`.

### Limit `currencyIdFromNetwork`

The network → currency link is too weak for product logic. Do **not** use it to decide token-ness, pick a coin family, drive receive UI, or otherwise infer currency behaviour from the descriptor's network.

Prefer:

- the **asset** (`assetId`, a token's `parentCurrencyId`)
- **account data** (`assetStatus`, `receive`, …) answered by a source that owns the descriptor

`currencyIdFromNetwork` is deprecated. Keep it only at the **legacy edge**: bridging a descriptor to APIs that still take a `CryptoCurrencyId` (`getCryptoCurrencyById`, `addressFromKey(currencyId, …)`, the live-common `Account` ↔ descriptor adapters). `networkFromCurrencyId` stays for the opposite direction when building a descriptor from a known currency.
