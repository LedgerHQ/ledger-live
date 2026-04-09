# CLI Wallet Layer

Clean, serializable wallet interface for the CLI. Sits between the legacy live-common bridge stack and CLI commands.

## Public API

### `models.ts` — serializable types

All types are plain JSON-safe values (no `BigNumber`, no `Date`, no circular refs). Zod schemas are exported for runtime validation at system boundaries.

```ts
import type { AccountDescriptor, Balance, Operation } from "./models";
```

| Type                | Key fields                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `AccountDescriptor` | `id`, `currencyId`, `freshAddress`, `derivationMode`, `index`                                   |
| `Balance`           | `assetId` (currency or token id), `balance` (BigNumberStr)                                      |
| `Operation`         | `id`, `hash`, `type`, `value`, `fee`, `senders`, `recipients`, `blockHeight`, `date` (ISO 8601) |

### `index.ts` — WalletAdapter

The main entry point. Routes each operation to the right backend (Alpaca for fast families, legacy bridge otherwise).

```ts
import { WalletAdapter } from "./wallet";

const wallet = new WalletAdapter();

// Stream discovered accounts for a currency (from connected device)
wallet.discoverAccounts("ethereum", deviceId).subscribe(descriptor => { ... });

// Fetch native + token balances
const balances: Balance[] = await wallet.getAccountBalances(descriptor);

// Fetch a page of operations (paginated for Alpaca families)
const { operations, nextCursor } = await wallet.getAccountOperations(descriptor, { limit: 50 });
const { operations: page2 } = await wallet.getAccountOperations(descriptor, { cursor: nextCursor });

// Get the current receive address
const address: string = await wallet.getFreshAddress(descriptor);
```

**Routing:** `evm`, `xrp`, `stellar`, `tezos` use Alpaca (direct API, paginated). All other families fall back to full bridge sync.

**Pagination:** only available for Alpaca families. Bridge sync returns all operations at once with `nextCursor: undefined`.

### `formatter.ts` — WalletFormatter

Human-readable string rendering. Async because token unit resolution may require a store lookup. Inject `CryptoAssetsStore` as a constructor dependency.

```ts
import { WalletFormatter } from "./formatter";

const fmt = new WalletFormatter(cryptoAssetsStore);

fmt.formatAccountDescriptor(descriptor); // sync  → "ethereum account #0 (segwit)  0xabc…"
await fmt.formatBalance(balance); // async → "1.5 ETH"
await fmt.formatOperation(operation); // async → "[OUT         ]  a1b2c3d4…  0.1 ETH  fee 0.002 ETH  0xabc…→0xdef…  …"
await fmt.formatList(operations, op => fmt.formatOperation(op)); // joins with \n
```

`Formatter<T> = (value: T) => Promise<string>` is the extensibility interface — pass any formatter function to `formatList`.

## Internal structure

```
wip/
  models.ts                  ← serializable types + Zod schemas
  index.ts                  ← WalletAdapter (routing)
  formatter.ts               ← WalletFormatter (human output)
  compatibility/
    bridge.ts                ← BridgeAdapter (full sync via live-common bridge)
    alpaca.ts                ← AlpacaAdapter (direct Alpaca API, paginated)
```

`compatibility/` is an internal implementation detail — do not import it directly from outside `wip/`.

---

## Integration

All four steps below are required before instantiating `WalletAdapter` or `WalletFormatter`. See `apps/cli/src/live-common-setup*.ts` for the reference implementation.

### 1. live-common coin graph

`BridgeAdapter` calls `getAccountBridge` / `getCurrencyBridge` from `@ledgerhq/live-common/bridge/index`. Internally `impl.ts` imports the generated `bridge/js` which statically imports **every coin family** — there is no selective registration. Importing this module brings the full coin graph into the bundle.

### 2. Declare supported currencies

`getCryptoCurrencyById` and the bridge filter against an allowlist. Call this once at startup with the currencies your app supports:

```ts
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

setSupportedCurrencies(["ethereum", "bitcoin", "ripple" /*, ... */]);
```

### 3. Set up the CAL client store

`WalletFormatter` resolves token display units via `CryptoAssetsStore`. Call `setupCalClientStore` once at startup — it returns the store to pass directly to the formatter:

```ts
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

const store = setupCalClientStore();
const fmt = new WalletFormatter(store);
```

### 4. Register a transport module

`discoverAccounts` drives the device through `withDevice(deviceId)` from `@ledgerhq/live-common/hw/deviceAccess`, which dispatches to whatever transport module you register. Two options:

**Legacy HID (simplest):**

```ts
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { retry } from "@ledgerhq/live-common/promise";

registerTransportModule({
  id: "hid",
  open: devicePath => retry(() => TransportNodeHid.open(devicePath)),
  disconnect: () => Promise.resolve(),
});
```

**DMK (preferred for `evm`, `xrp`, `stellar`, `tezos`):**

For these families the signers auto-detect a DMK transport by duck-typing `.dmk` + `.sessionId` on the transport object and switch to the DMK signer path:

```ts
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";

registerTransportModule({
  id: "dmk",
  open: () => DeviceManagementKitTransport.open(),
  disconnect: () => Promise.resolve(),
});
```

> **Note:** `discoverAccounts(currencyId, deviceId)` currently takes a string `deviceId` (HID path or DMK session ID). The plan is to replace this with a `deriveKey` callback once the DMK abstraction stabilises — at which point this transport registration step goes away entirely.
