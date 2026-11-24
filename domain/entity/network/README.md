# @domain/entity-network

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The network an account lives on, and an address on it. Any code may use it; an account descriptor carries a `NetworkId`, but the descriptor itself stays at the edges (see [`@domain/entity-account-descriptor`](../account-descriptor)).

## Main exports

| Export | Role |
| --- | --- |
| `NetworkIdSchema` / `NetworkId` | branded CAL network id (`bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`) |
| `toNetworkId` | a `NetworkId` from a string; throws `UnknownNetworkError` for an empty or malformed id |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | the only bridge between `NetworkId` and `CryptoCurrencyId` |
| `AddressSchema` / `Address` | an address on a network, branded so analytics can refuse it |
| `UnknownNetworkError` | thrown for an unknown or malformed network id |

## NetworkId vs CryptoCurrencyId

A `NetworkId` names a chain; a `CryptoCurrencyId` (`@domain/entity-currency-crypto`) names a currency. Both are branded, so one cannot be passed for the other. They hold the same string for now, but `networkFromCurrencyId` and `currencyIdFromNetwork` are the only way to convert, and they throw `UnknownNetworkError` for an unknown id. Keep their call sites few: carry a `NetworkId` where code is about the network, and get one from `NetworkIdSchema.parse` or a parsed descriptor.
