# Ledger Live Libraries - Architecture

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Overview

The libraries in Ledger Live provide the core business logic, blockchain integrations, and hardware wallet communication. They are designed as modular packages that can be shared between desktop and mobile applications.

## Library Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Applications                             │
│         (ledger-live-desktop, ledger-live-mobile)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   @ledgerhq/live-common                      │
│        (bridges, families, exchange, wallet-api)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────┬──────────────────────────────────────┐
│   @ledgerhq/coin-*   │         @ledgerhq/ledgerjs           │
│   (coin-modules)     │    (hw-transport, hw-app-*)          │
└──────────────────────┴──────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  @ledgerhq/coin-framework                    │
│              (shared abstractions & types)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Coin Modules Architecture

Each coin module in `libs/coin-modules/` follows a consistent folder structure:

```
coin-{name}/
├── src/
│   ├── network/          # 🌐 Explorer/Node Communication
│   ├── api/              # 📡 New API Implementation
│   ├── bridge/           # 🌉 Legacy Bridge Implementation
│   ├── logic/            # 🧠 Shared Business Logic
│   ├── types/            # 📝 Type Definitions
│   ├── config.ts         # ⚙️ Chain Configuration
│   ├── hw-getAddress.ts  # 🔑 Hardware Address Derivation
│   └── specs.ts          # 🧪 Bot Testing Specs
├── package.json
└── tsconfig.json
```

### Folder Responsibilities

#### `network/` - Explorer/Node Communication

Handles all external network communication with blockchain infrastructure:

```typescript
// libs/coin-modules/coin-tron/src/network/index.ts
export async function fetchAccount(address: string): Promise<AccountInfo> {
  // Communication with TronGrid/TronScan explorer
}

export async function broadcastTransaction(tx: SignedTx): Promise<string> {
  // Send transaction to node
}
```

**Responsibilities:**
- HTTP/WebSocket clients for explorers and nodes
- Response parsing and normalization
- Rate limiting and retry logic
- Network-specific error handling

#### `api/` - New API Model Implementation

Implements the standardized `Api` interface defined in `coin-framework`:

```typescript
// Interface from libs/coin-framework/src/api/types.ts
export type Api = {
  // Core operations
  getBalance: (address: string) => Promise<bigint>;
  getTransactions: (address: string, options?: PaginationOptions) => Promise<Operation[]>;
  broadcastTransaction: (signedTx: string, config?: BroadcastConfig) => Promise<string>;
  
  // Account discovery
  estimateFees: (tx: Transaction) => Promise<bigint>;
  
  // ... additional methods
};
```

**Key Types:**

| Type | Description |
|------|-------------|
| `Operation` | Normalized transaction/operation format |
| `Transaction` | Transaction object for building/signing |
| `BlockInfo` | Block metadata (height, hash, time) |
| `AssetInfo` | Asset details (native, token, NFT) |

**Migration Status:** This is the **target architecture**. Coin modules are progressively migrating from bridge to api model.

#### `bridge/` - Legacy Bridge Implementation

Implements the `Bridge` interface from `types-live`:

```typescript
// Interface from libs/ledgerjs/packages/types-live/src/bridge.ts
export type Bridge<T, A, U, O, R> = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<T, A, U, O, R>;
};

// CurrencyBridge - Currency-level operations
interface CurrencyBridge {
  preload(currency: CryptoCurrency): Promise<Record<string, any>>;
  hydrate(data: unknown, currency: CryptoCurrency): void;
  scanAccounts(info: ScanInfo): Observable<ScanAccountEvent>;
}

// AccountBridge - Account-level operations
interface AccountBridge<T, A, U, O, R> {
  sync(account: A, syncConfig: SyncConfig): Observable<A>;
  createTransaction(account: A): T;
  prepareTransaction(account: A, transaction: T): Promise<T>;
  getTransactionStatus(account: A, transaction: T): Promise<U>;
  signOperation(args: SignOperationArg0<T, A>): Observable<SignOperationEvent>;
  broadcast(args: BroadcastArg<A>): Promise<Operation>;
}
```

**Note:** Bridge is the **legacy pattern**. New features should use the `api/` model.

#### `logic/` - Shared Business Logic

Contains pure functions shared between `api/` and `bridge/`:

```typescript
// libs/coin-modules/coin-{name}/src/logic/
export function validateAddress(address: string): boolean { }
export function calculateFees(tx: Transaction): bigint { }
export function parseOperations(rawOps: RawOperation[]): Operation[] { }
```

**Guidelines:**
- Pure functions, no side effects
- No network calls
- Reusable between api and bridge implementations
- Well-tested with unit tests

---

## coin-framework

The `coin-framework` library provides shared abstractions for all coin modules:

```
libs/coin-framework/
├── src/
│   ├── api/
│   │   ├── types.ts          # Core Api interface definition
│   │   └── index.ts          # Exports
│   ├── bridge/               # Bridge utilities
│   ├── account/              # Account helpers
│   ├── operation/            # Operation helpers
│   └── transaction/          # Transaction helpers
```

### Key Types

```typescript
// Operation - Normalized blockchain operation
type Operation<MemoType = MemoNotSupported> = {
  id: string;
  type: string;
  senders: string[];
  recipients: string[];
  value: bigint;
  asset: AssetInfo;
  memo?: MemoType;
  details?: Record<string, unknown>;
  tx: {
    hash: string;
    block: BlockInfo;
    fees: bigint;
    date: Date;
    failed: boolean;
  };
};

// Transaction - Transaction to be built/signed
type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
} & Record<string, unknown>;
```

---

## ledgerjs

The `ledgerjs` packages provide hardware wallet communication:

```
libs/ledgerjs/packages/
├── hw-transport/              # Abstract transport interface
├── hw-transport-node-hid/     # USB HID (Node.js)
├── hw-transport-web-ble/      # Web Bluetooth
├── hw-transport-webhid/       # WebHID API
├── hw-app-btc/                # Bitcoin app interface
├── hw-app-eth/                # Ethereum app interface
├── hw-app-solana/             # Solana app interface
└── ... (30+ hw-app packages)
```

### Transport Layer

```typescript
// Abstract transport - all implementations extend this
import Transport from "@ledgerhq/hw-transport";

class MyTransport extends Transport {
  exchange(apdu: Buffer): Promise<Buffer>;
  close(): Promise<void>;
}
```

### Hardware App Interface

```typescript
// Example: hw-app-btc
import Btc from "@ledgerhq/hw-app-btc";

const btc = new Btc(transport);
const { publicKey, address } = await btc.getWalletPublicKey(path);
const signature = await btc.signTransaction(path, rawTxHex);
```

---

## ledger-live-common

The main shared library connecting everything:

```
libs/ledger-live-common/src/
├── bridge/                    # Bridge orchestration
│   ├── jsHelpers.ts           # JS bridge utilities
│   └── sync.ts                # Account sync logic
├── families/                  # Coin family configurations
│   ├── bitcoin/
│   ├── evm/
│   └── ... (30 families)
├── hw/                        # Hardware operations
├── deviceSDK/                 # Device SDK
├── exchange/                  # Swap/exchange logic
├── dada-client/               # RTK Query data client
└── wallet-api/                # Wallet API server
```

### Data Fetching (RTK Query)

```typescript
// dada-client - Assets data aggregator
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";

const { data, isLoading } = useAssetsData({
  product: "lld",
  version: "2.0.0",
});
```

---

## ledger-services

Backend service clients:

```
libs/ledger-services/
├── cal/                       # Crypto Assets List service
│   ├── src/
│   │   ├── tokens.ts          # Token data
│   │   ├── currencies.ts      # Currency data
│   │   ├── networks.ts        # Network configurations
│   │   └── partners/          # Exchange partners
└── trust/                     # Trust verification service
    └── src/
        ├── hedera.ts          # Hedera verification
        └── solana.ts          # Solana verification
```

---

## Migration: Bridge → API

The codebase is migrating from the legacy **Bridge** pattern to the new **API** model:

| Aspect | Bridge (Legacy) | API (Target) |
|--------|-----------------|--------------|
| Interface | `CurrencyBridge` + `AccountBridge` | `Api` type |
| Location | `bridge/` folder | `api/` folder |
| Observables | RxJS heavily used | Promises preferred |
| Coupling | Tightly coupled to live-common | Standalone, testable |
| Testing | Integration-heavy | Unit test friendly |

### Migration Steps for a Coin Module

1. **Implement `api/index.ts`** following the `Api` interface
2. **Move network logic** from bridge to `network/`
3. **Extract shared code** to `logic/`
4. **Add integration tests** in `api/index.integ.test.ts`
5. **Update live-common family** to use new api

---

## Testing Strategy

### Unit Tests

```bash
# Run coin module tests
pnpm coin:bitcoin test
pnpm coin:evm test
```

### Integration Tests

```bash
# API integration tests
pnpm coin:bitcoin test-integ
pnpm coin:evm test-integ
```

### Bot Testing

Automated testing with real devices via `specs.ts`:

```typescript
// libs/coin-modules/coin-bitcoin/src/specs.ts
export default {
  currency: getCryptoCurrencyById("bitcoin"),
  mutations: [
    { name: "send max", ... },
    { name: "send 50%", ... },
  ],
};
```

---

## Adding a New Coin Module

1. **Copy boilerplate:** `libs/coin-modules/coin-module-boilerplate/`
2. **Implement folders:** `network/`, `api/`, `logic/`
3. **Add hw-app:** Create or use existing `@ledgerhq/hw-app-{name}`
4. **Register in live-common:** Add family in `libs/ledger-live-common/src/families/`
5. **Add to generated files:** Update `libs/ledger-live-common/src/generated/`
