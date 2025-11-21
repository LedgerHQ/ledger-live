
# @ledgerhq/cryptoassets

Ledger's material for crypto currencies, tokens and fiats. Also includes signatures required by Nano devices for these tokens.

This library provides dynamic RTK Query-based token lookup capabilities through the **CAL (Crypto Assets List) Client**. Static token data has been removed in favor of the async API.

## CAL Client

The **CAL (Crypto Assets List) Client** is the main interface for fetching and managing token data dynamically via API.

**📚 [See the complete CAL Client documentation →](./src/cal-client/README.md)**

## Deprecated / Future Changes

The following parts of this library are planned to be moved or removed:

- **`abandonseed`**: Will be moved back into individual coin modules
- **`api-token-converter` / `api-asset-converter`**: Will no longer be needed as the conversion logic will be handled differently
- **`currencies`**: Will eventually be imported from a backend service instead of being bundled
