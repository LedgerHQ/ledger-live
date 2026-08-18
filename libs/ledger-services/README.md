# ledger-services

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This workspace groups typed HTTP client libraries for Ledger's backend services. Each sub-package wraps a specific Ledger API, providing strongly-typed request/response models and integration-tested clients.

## Packages

### `@ledgerhq/ledger-cal-service` (`cal/`)

Client for Ledger's **CAL (Crypto Assets List)** service. CAL is the authoritative source for Ledger's supported assets metadata.

**What it does:**
- Fetches asset certificates (authenticity proofs for Ledger-supported tokens)
- Queries supported currencies and networks
- Retrieves token lists and partner token metadata

**Key exports:** `getCurrencies`, `getNetworks`, `getTokens`, `getCertificate`, `getPartners`

---

### `@ledgerhq/ledger-trust-service` (`trust/`)

Client for Ledger's **Trust service**, which provides validator and stake account data for proof-of-stake chains.

**What it does:**
- Fetches Solana validator information and trust scores
- Fetches Hedera network node/trust data
- Provides typed response models for validator metadata

**Key exports:** `getSolanaValidators`, `getHederaNodes`

## Usage context

Both packages are used by `ledger-live-common` and coin-specific libs to resolve asset metadata and validator data at runtime. Desktop and Mobile both depend on them transitively.
