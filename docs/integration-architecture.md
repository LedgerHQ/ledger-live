# Ledger Live - Integration Architecture

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Overview

This document describes how the different parts of the Ledger Live monorepo integrate and communicate with each other.

---

## Coin Module Integration

### Integration Paths

There are two paths for integrating coin modules with the applications:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATIONS                                    │
│                        (Desktop / Mobile / CLI)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ledger-live-common                                  │
│                                                                             │
│  ┌─────────────────────────┐     ┌─────────────────────────────────────┐   │
│  │  bridge/impl.ts         │     │  bridge/generic-alpaca/             │   │
│  │  (Legacy JS Bridges)    │     │  (Alpaca Generic Adapter)           │   │
│  │                         │     │                                     │   │
│  │  - jsBridges[family]    │     │  - getAlpacaAccountBridge()         │   │
│  │  - mockBridges[family]  │     │  - getAlpacaCurrencyBridge()        │   │
│  └───────────┬─────────────┘     └─────────────┬───────────────────────┘   │
│              │                                  │                           │
└──────────────┼──────────────────────────────────┼───────────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────────┐
│  coin-module/bridge/         │   │  coin-module/api/                        │
│  (Legacy Bridge Pattern)     │   │  (New Alpaca API Pattern)                │
│                              │   │                                          │
│  - CurrencyBridge            │   │  - createApi() factory                   │
│  - AccountBridge             │   │  - AlpacaApi interface                   │
└──────────────────────────────┘   └──────────────────────────────────────────┘
```

### Path 1: Legacy JS Bridges (Current)

Coin modules are registered in `ledger-live-common/src/generated/bridge/js.ts` and accessed through `bridge/impl.ts`:

```typescript
// libs/ledger-live-common/src/bridge/impl.ts
import jsBridges from "../generated/bridge/js";

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  const jsBridge = jsBridges[currency.family];
  if (jsBridge) {
    return jsBridge.currencyBridge;
  }
  throw new CurrencyNotSupported(...);
};

export const getAccountBridge = (account: AccountLike): AccountBridge<any> => {
  // ... validation
  return getAccountBridgeByFamily(currency.family, mainAccount.id);
};
```

### Path 2: Alpaca Generic Adapter (Target Architecture)

For coin modules that implement the `Api` interface, the generic Alpaca adapter provides a unified bridge:

```typescript
// libs/ledger-live-common/src/bridge/impl.ts
const alpacaized = {
  evm: true,
  xrp: true,
  stellar: true,
  tezos: true,
};

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (alpacaized[currency.family]) {
    return getAlpacaCurrencyBridge(currency.family, "local");
  }
  // ... fallback to legacy
};
```

The Alpaca adapter resolves coin APIs dynamically:

```typescript
// libs/ledger-live-common/src/bridge/generic-alpaca/alpaca/index.ts
export function getAlpacaApi(network: string, kind: string): Api<any> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return createXrpApi(getCurrencyConfiguration<XrpCoinConfig>(currency));
      case "stellar":
        return createStellarApi(getCurrencyConfiguration<StellarCoinConfig>(currency));
      case "tron":
        return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currency));
      case "evm":
        return createEvmApi(getCurrencyConfiguration<EvmConfigInfo>(currency), currency.id);
      // ... other families
    }
  }
  return getNetworkAlpacaApi(network);
}
```

---

## Generic Alpaca Bridges

The Alpaca adapter provides generic implementations of both bridge types.

### CurrencyBridge

```typescript
// libs/ledger-live-common/src/bridge/generic-alpaca/currencyBridge.ts
export function getAlpacaCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): CurrencyBridge {
  const signer = customSigner ?? getSigner(network);
  return {
    preload: () => Promise.resolve({}),
    hydrate: () => undefined,
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      postSync,
    }),
  };
}
```

### AccountBridge

```typescript
// libs/ledger-live-common/src/bridge/generic-alpaca/accountBridge.ts
export function getAlpacaAccountBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): AccountBridge<GenericTransaction> {
  const signer = customSigner ?? getSigner(network);
  return {
    sync: makeSync({ getAccountShape: genericGetAccountShape(network, kind), postSync }),
    receive: makeAccountBridgeReceive(getAddressWrapper(signer.getAddress)),
    createTransaction,
    updateTransaction,
    prepareTransaction: genericPrepareTransaction(network, kind),
    getTransactionStatus: genericGetTransactionStatus(network, kind),
    estimateMaxSpendable: genericEstimateMaxSpendable(network, kind),
    broadcast: genericBroadcast(network, kind),
    signOperation: genericSignOperation(network, kind)(signer.context),
    signRawOperation: genericSignRawOperation(network, kind)(signer.context),
    getSerializedAddressParameters,
    validateAddress: getValidateAddress(network),
  };
}
```

---

## Migration Path

### Current State → Target State

| Aspect | Current (Legacy) | Target (Alpaca) |
|--------|------------------|-----------------|
| Interface | `Bridge` (CurrencyBridge + AccountBridge) | `Api` (AlpacaApi + BridgeApi) |
| Registration | Manual in `generated/bridge/js.ts` | Factory pattern via `createApi()` |
| Bridge code | Per-coin implementation | Generic adapter + coin API |
| Location | `coin-module/bridge/` | `coin-module/api/` |

### Migration Steps for a Coin Module

1. **Implement `Api` interface** in `src/api/index.ts`
2. **Add coin to `alpacaized` map** in `bridge/impl.ts`
3. **Register factory** in `generic-alpaca/alpaca/index.ts`
4. **Deprecate bridge folder** (keep for backward compatibility temporarily)

---

## How Apps Use ledger-live-common

`ledger-live-common` serves as the shared business logic layer between Desktop (LLD) and Mobile (LLM):

```
┌───────────────────┐     ┌───────────────────┐
│  ledger-live-     │     │  ledger-live-     │
│  desktop (LLD)    │     │  mobile (LLM)     │
└─────────┬─────────┘     └─────────┬─────────┘
          │                         │
          └──────────┬──────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  ledger-live-common │
          │                     │
          │  • Bridge impl      │
          │  • Account logic    │
          │  • Families config  │
          │  • Shared utilities │
          └─────────────────────┘
```

### Usage Pattern

Apps import and use ledger-live-common when sharing code is beneficial:

```typescript
// In LLD or LLM
import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/impl";
import { getEnv } from "@ledgerhq/live-env";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies";

// Get bridge for an account
const bridge = getAccountBridge(account);

// Sync account
const synced = await bridge.sync(account, syncConfig);

// Create and broadcast transaction
const tx = bridge.createTransaction(account);
const prepared = await bridge.prepareTransaction(account, tx);
const status = await bridge.getTransactionStatus(account, prepared);
```

---

## How Coin Modules Use coin-framework

`coin-framework` provides the foundational types and utilities for coin modules:

```
┌─────────────────────────────────────────────────────────────────┐
│                        coin-framework                            │
│                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │  Bridge Utilities        │  │  API Types                  │  │
│  │  (Current)               │  │  (Target)                   │  │
│  │                          │  │                             │  │
│  │  • jsHelpers             │  │  • Api interface            │  │
│  │  • getAddressWrapper     │  │  • AlpacaApi interface      │  │
│  │  • makeScanAccounts      │  │  • BridgeApi interface      │  │
│  │  • makeSync              │  │  • Operation, Balance, etc. │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Shared Utilities                                         │   │
│  │  • Account helpers                                        │   │
│  │  • Transaction builders                                   │   │
│  │  • Serialization                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │        coin-modules           │
              │  (coin-btc, coin-evm, etc.)   │
              └───────────────────────────────┘
```

### Future Split

Long-term, `coin-framework` will be split into two packages:

| Package | Contents |
|---------|----------|
| **coin-framework-bridge** | Legacy bridge utilities (jsHelpers, makeScanAccounts, etc.) |
| **coin-framework-api** | Alpaca API types and utilities |

---

## Data Flow: Account Sync

```
┌─────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   App   │ ──▶ │ AccountBridge   │ ──▶ │  Api         │ ──▶ │  Explorer/   │
│         │     │ .sync()         │     │  .getBalance │     │  Indexer     │
│         │     │                 │     │  .listOps    │     │              │
└─────────┘     └─────────────────┘     └──────────────┘     └──────────────┘
     ▲                                         │
     │                                         │
     └─────────────────────────────────────────┘
                    Account data
```

### Sync Steps

1. App calls `bridge.sync(account, syncConfig)`
2. Bridge calls `getAccountShape(network, kind)`
3. AccountShape calls `api.getBalance(address)` and `api.listOperations(address, pagination)`
4. Data is transformed and returned as updated `Account`

---

## Data Flow: Transaction Broadcast

```
┌─────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   App   │ ──▶ │ AccountBridge   │ ──▶ │  Api         │ ──▶ │  Node/       │
│         │     │ .broadcast()    │     │  .broadcast  │     │  Network     │
└─────────┘     └─────────────────┘     └──────────────┘     └──────────────┘
     │                                                              │
     │ 1. createTransaction                                         │
     │ 2. prepareTransaction                                        │
     │ 3. getTransactionStatus                                      │
     │ 4. signOperation (with device)                               │
     │ 5. broadcast ─────────────────────────────────────────────▶  │
     │                                                              │
     │ ◀──────────────────────── txHash ────────────────────────────┘
```

---

## RTK Query Clients

Apps and libraries use RTK Query clients to access Ledger services:

| Client | Purpose | Location |
|--------|---------|----------|
| **cal-client** | Crypto Assets List (tokens, currencies) | `libs/ledger-services/cal/` |
| **dada-client** | Dynamic Assets Data Aggregator | `libs/ledger-live-common/src/dada-client/` |
| **cmc-client** | CoinMarketCap data | `libs/ledger-live-common/src/cmc-client/` |

### Usage Pattern

```typescript
import { useGetTokensQuery } from "@ledgerhq/cal-client";

const { data, isLoading, error } = useGetTokensQuery({ chainId: 1 });
```

---

## Related Documentation

- [Architecture - Libraries](./architecture-libraries.md)
- [API Contracts](./api-contracts.md)
- [Architecture - Desktop](./architecture-desktop.md)
- [Architecture - Mobile](./architecture-mobile.md)
