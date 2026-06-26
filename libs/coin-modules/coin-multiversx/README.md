# @ledgerhq/coin-multiversx

Ledger MultiversX (EGLD) coin integration for Ledger Live. This package provides account synchronization, transaction building, and staking support for the MultiversX blockchain.

## Installation

```bash
pnpm add @ledgerhq/coin-multiversx
```

## Alpaca API

This package implements the Alpaca API interface (`Api<MemoNotSupported, TxDataNotSupported>`) from `@ledgerhq/coin-framework`, providing a standardized way to interact with the MultiversX blockchain.

### Creating an API Instance

```typescript
import { createApi } from "@ledgerhq/coin-multiversx/api";

// Create with default configuration (uses environment variables)
const api = createApi();

// Or create with custom endpoints
const customApi = createApi({
  apiEndpoint: "https://api.multiversx.com",
  delegationApiEndpoint: "https://delegation-api.multiversx.com",
});
```

### Configuration

The `createApi()` function accepts an optional configuration object:

```typescript
interface MultiversXApiConfig {
  /** MultiversX API endpoint override. */
  apiEndpoint?: string;
  /** Delegation API endpoint override. */
  delegationApiEndpoint?: string;
}
```

**Default values** (from environment variables):

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `apiEndpoint` | `MULTIVERSX_API_ENDPOINT` | Main API endpoint for account/transaction data |
| `delegationApiEndpoint` | `MULTIVERSX_DELEGATION_API_ENDPOINT` | Delegation API (defaults to `apiEndpoint` if not set) |

---

## Core Methods

### getBalance(address)

Retrieves native EGLD and ESDT token balances for a MultiversX address.

```typescript
const balances = await api.getBalance("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

// Example response:
// [
//   { value: 1000000000000000000n, asset: { type: "native" } },
//   { value: 500000000n, asset: { type: "esdt", assetReference: "USDC-c76f1f" } }
// ]

// Note: Always returns at least native balance (never empty array)
// For empty accounts: [{ value: 0n, asset: { type: "native" } }]
```

### listOperations(address, pagination)

Lists historical operations (transactions) for an address with pagination support.

```typescript
// Get first page of operations
const [operations, nextCursor] = await api.listOperations(
  "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
  { limit: 20 }
);

// Get next page using cursor
if (nextCursor) {
  const [moreOps, cursor] = await api.listOperations(
    "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    { limit: 20, pagingToken: nextCursor }
  );
}

// Filter by minimum block height
const [ops] = await api.listOperations(address, {
  limit: 50,
  minHeight: 1000000,
});
```

### getSequence(address)

Retrieves the account nonce (sequence number) used for transaction ordering.

```typescript
const nonce = await api.getSequence("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

// Example response: 42n (bigint)
// Returns 0n for new/empty accounts
```

### lastBlock()

Gets the current block height from the MultiversX network.

```typescript
const blockInfo = await api.lastBlock();

// Example response:
// { height: 12345678 }
```

---

## Staking Methods

### getStakes(address)

Retrieves delegation positions (stakes) for an address.

```typescript
const stakes = await api.getStakes("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

// Example response:
// {
//   items: [
//     {
//       uid: "erd1qyu5...-erd1qqqq...",
//       address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
//       delegate: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
//       state: "active",
//       asset: { type: "native" },
//       amount: 1050000000000000000n,
//       amountDeposited: 1000000000000000000n,
//       amountRewarded: 50000000000000000n
//     }
//   ],
//   next: undefined
// }
```

**Stake states:**
- `"active"` - Currently staked and earning rewards
- `"deactivating"` - Unbonding period (unstaking in progress)
- `"inactive"` - Ready for withdrawal

### getValidators()

Retrieves the list of available validators for delegation.

```typescript
const validators = await api.getValidators();

// Example response:
// {
//   items: [
//     {
//       address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
//       name: "Ledger",
//       description: "Ledger staking provider",
//       url: "https://www.ledger.com",
//       commissionRate: "0.1",  // 10% as string
//       apy: 0.08,              // 8% APY as number
//       balance: 5000000000000000000000n
//     }
//   ],
//   next: undefined
// }
```

---

## Transaction Lifecycle

### estimateFees(intent)

Estimates transaction fees based on the transaction type.

```typescript
// Estimate fee for native EGLD transfer
const fees = await api.estimateFees({
  intentType: "transaction",
  sender: "erd1sender...",
  recipient: "erd1recipient...",
  amount: 1000000000000000000n, // 1 EGLD
  asset: { type: "native" },
});

// Example response:
// {
//   value: 50000000000000n, // 0.00005 EGLD
//   parameters: {
//     gasLimit: 50000,
//     gasPrice: 1000000000n
//   }
// }

// Estimate fee for ESDT token transfer
const esdtFees = await api.estimateFees({
  intentType: "transaction",
  sender: "erd1sender...",
  recipient: "erd1recipient...",
  amount: 1000000n,
  asset: { type: "esdt", assetReference: "USDC-c76f1f" },
});

// Gas limits by transaction type:
// - Native EGLD transfer: 50,000
// - ESDT token transfer: 500,000
// - Delegation operations: 75,000,000
// - Claim rewards: 6,000,000
```

### craftTransaction(intent, fees?)

Creates an unsigned transaction ready for signing.

#### Native EGLD Transfer

```typescript
const tx = await api.craftTransaction({
  intentType: "transaction",
  sender: "erd1sender...",
  recipient: "erd1recipient...",
  amount: 1000000000000000000n, // 1 EGLD (18 decimals)
  asset: { type: "native" },
});

// Returns CraftedTransaction:
// {
//   transaction: '{"nonce":42,"value":"1000000000000000000","receiver":"erd1...",...}',
//   details: { gasLimit: 50000, gasPrice: 1000000000 }
// }
```

#### ESDT Token Transfer

```typescript
const tx = await api.craftTransaction({
  intentType: "transaction",
  sender: "erd1sender...",
  recipient: "erd1recipient...",
  amount: 1000000n, // Token amount in smallest unit
  asset: { type: "esdt", assetReference: "USDC-c76f1f" },
});
```

#### Delegation Operations

```typescript
// Delegate (stake) EGLD to a validator
const delegateTx = await api.craftTransaction({
  intentType: "staking",
  type: "delegate",
  sender: "erd1sender...",
  recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy", // Validator contract
  amount: 1000000000000000000n, // Min 1 EGLD
  asset: { type: "native" },
});

// Undelegate (unstake) from a validator
const undelegateTx = await api.craftTransaction({
  intentType: "staking",
  type: "undelegate",
  sender: "erd1sender...",
  recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
  amount: 500000000000000000n,
  asset: { type: "native" },
});

// Claim rewards
const claimTx = await api.craftTransaction({
  intentType: "staking",
  type: "claimRewards",
  sender: "erd1sender...",
  recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
  amount: 0n, // No amount for claims
  asset: { type: "native" },
});

// Withdraw unstaked funds
const withdrawTx = await api.craftTransaction({
  intentType: "staking",
  type: "withdraw",
  sender: "erd1sender...",
  recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
  amount: 0n,
  asset: { type: "native" },
});
```

### combine(tx, signature)

Combines an unsigned transaction with a signature to produce a signed transaction.

```typescript
// After signing with hardware wallet
const signedTx = api.combine(
  tx.transaction, // Unsigned transaction JSON from craftTransaction
  "abcd1234..."   // Hex-encoded signature from hardware wallet
);

// Returns JSON string ready for broadcast
```

### broadcast(signedTx)

Broadcasts a signed transaction to the MultiversX network.

```typescript
const txHash = await api.broadcast(signedTx);

// Returns transaction hash:
// "a1b2c3d4e5f6..."
```

### validateIntent(intent, balances, fees?)

Validates a transaction intent against account balances before signing.

```typescript
const balances = await api.getBalance(senderAddress);
const fees = await api.estimateFees(intent);

const validation = await api.validateIntent(intent, balances, fees);

// Example response (TransactionValidation):
// {
//   errors: {},                              // Record<string, Error>
//   warnings: {},                            // Record<string, Error>
//   amount: 1000000000000000000n,            // Amount to send
//   estimatedFees: 50000000000000n,          // Fees
//   totalSpent: 1000050000000000000n         // Amount + fees
// }

// With insufficient balance:
// {
//   errors: { amount: Error("Insufficient balance") },
//   warnings: {},
//   amount: 0n,
//   estimatedFees: 50000000000000n,
//   totalSpent: 0n
// }
```

---

## Unsupported Methods

The following methods throw `"not supported"` errors:

| Method | Reason |
|--------|--------|
| `getRewards()` | Historical rewards data not available via MultiversX explorer API |
| `getBlock()` | Full block data not required for Ledger Live operations |
| `getBlockInfo()` | Full block data not required for Ledger Live operations |
| `craftRawTransaction()` | MultiversX uses structured JSON transactions, not raw bytes |

```typescript
// These will throw errors:
await api.getRewards(address);          // Error: "getRewards is not supported"
await api.getBlock(height);             // Error: "getBlock is not supported"
await api.getBlockInfo(height);         // Error: "getBlockInfo is not supported"
await api.craftRawTransaction(...);     // Error: "craftRawTransaction is not supported"
```

---

## Complete Workflow Example

End-to-end example: Send 1 EGLD from one address to another.

```typescript
import { createApi } from "@ledgerhq/coin-multiversx/api";

async function sendEgld(
  senderAddress: string,
  recipientAddress: string,
  amount: bigint,
  signTransaction: (tx: string) => Promise<string>
): Promise<string> {
  const api = createApi();

  // 1. Check sender's balance
  const balances = await api.getBalance(senderAddress);
  const nativeBalance = balances.find(b => b.asset.type === "native");
  console.log(`Current balance: ${nativeBalance?.value} (smallest unit)`);

  // 2. Build transaction intent
  const intent = {
    intentType: "transaction" as const,
    sender: senderAddress,
    recipient: recipientAddress,
    amount,
    asset: { type: "native" as const },
  };

  // 3. Estimate fees
  const fees = await api.estimateFees(intent);
  console.log(`Estimated fee: ${fees.value} (gas: ${fees.parameters?.gasLimit})`);

  // 4. Validate intent against balances
  const validation = await api.validateIntent(intent, balances, fees);
  if (Object.keys(validation.errors).length > 0) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validation failed: ${firstError.message}`);
  }

  // 5. Craft unsigned transaction
  const unsignedTx = await api.craftTransaction(intent, fees);

  // 6. Sign with hardware wallet (provided by caller)
  const signature = await signTransaction(unsignedTx.transaction);

  // 7. Combine signature with transaction
  const signedTx = api.combine(unsignedTx.transaction, signature);

  // 8. Broadcast to network
  const txHash = await api.broadcast(signedTx);
  console.log(`Transaction submitted: ${txHash}`);

  return txHash;
}
```

---

## Development

### Scripts

```bash
# Build
pnpm build

# Run tests
pnpm test

# Run integration tests
pnpm test-integ

# Run coverage
pnpm coverage

# Lint
pnpm lint
pnpm lint:fix
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MULTIVERSX_API_ENDPOINT` | MultiversX API endpoint | Production API |
| `MULTIVERSX_DELEGATION_API_ENDPOINT` | Delegation API endpoint | Same as API endpoint |

## License

Apache-2.0
