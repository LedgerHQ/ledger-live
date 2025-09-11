# ACRE Wallet API Module

This module provides ACRE-specific functionality for the Ledger Live Wallet API, including message signing, transaction signing/broadcasting, and yield-bearing Ethereum address registration.

## Features

### `messageSign`

Signs ACRE-specific messages (Withdraw or SignIn) using the specified account.

#### Parameters

- `accountId` (string): The Ledger Live account ID
- `message` (AcreMessage): The message to sign (Withdraw or SignIn type)
- `derivationPath` (string, optional): Relative derivation path from the account (e.g., "0/0")
- `options` (SignOptions, optional): Hardware wallet app ID and dependencies
- `meta` (object, optional): Additional metadata

#### Returns

Returns a `Buffer` containing the signed message.

#### Example Usage

```typescript
import { AcreModule, AcreMessageType } from "@ledgerhq/wallet-api-acre-module";

const acreModule = new AcreModule(transport);

// Sign a withdrawal message
const withdrawalMessage = {
  type: AcreMessageType.Withdraw,
  message: {
    to: "0x1234567890123456789012345678901234567890",
    value: "1000000000000000000",
    data: "0x",
    operation: "call",
    safeTxGas: "21000",
    baseGas: "0",
    gasPrice: "20000000000",
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce: "0",
  },
};

const signedMessage = await acreModule.messageSign(
  "js:2:ethereum:0x1234567890123456789012345678901234567890:ethereum",
  withdrawalMessage,
  "0/0",
);
```

### `transactionSign`

Signs a transaction without broadcasting it.

#### Parameters

- `accountId` (string): The Ledger Live account ID
- `transaction` (Transaction): The transaction object in currency family-specific format
- `options` (TransactionOptions, optional): Hardware wallet app ID and dependencies
- `meta` (object, optional): Additional metadata

#### Returns

Returns a `Buffer` containing the signed transaction.

#### Example Usage

```typescript
const transaction = {
  family: "evm",
  mode: "send",
  recipient: "0x1234567890123456789012345678901234567890",
  amount: "1000000000000000000",
  gasPrice: "20000000000",
  gasLimit: "21000",
};

const signedTx = await acreModule.transactionSign(
  "js:2:ethereum:0x1234567890123456789012345678901234567890:ethereum",
  transaction,
);
```

### `transactionSignAndBroadcast`

Signs and broadcasts a transaction.

#### Parameters

- `accountId` (string): The Ledger Live account ID
- `transaction` (Transaction): The transaction object in currency family-specific format
- `options` (TransactionOptions, optional): Hardware wallet app ID and dependencies
- `meta` (object, optional): Additional metadata

#### Returns

Returns a `string` containing the transaction hash.

#### Example Usage

```typescript
const transactionHash = await acreModule.transactionSignAndBroadcast(
  "js:2:ethereum:0x1234567890123456789012345678901234567890:ethereum",
  transaction,
);
```

### `registerYieldBearingEthereumAddress`

Registers a yield-bearing Ethereum address in Ledger Live, creating both a parent Ethereum account and a token account for the specified token contract.

#### Parameters

- `ethereumAddress` (string): The Ethereum address to register
- `tokenContractAddress` (string, optional): The ERC20 token contract address of acre contract
- `tokenTicker` (string, optional): Alternative to contract address, must be provided with full path (e.g., "ethereum/erc20/acreBTC")
- `meta` (object, optional): Additional metadata

**Note**: Either `tokenContractAddress` or `tokenTicker` must be provided.

#### Returns

Returns a promise that resolves to an object containing:

- `success` (boolean): Whether the registration was successful
- `accountName` (string): The name of the created account
- `parentAccountId` (string): The ID of the parent Ethereum account
- `tokenAccountId` (string): The ID of the token account
- `ethereumAddress` (string): The registered Ethereum address
- `tokenContractAddress` (string): The token contract address used
- `meta` (object, optional): Additional metadata

#### Example Usage

```typescript
// Register with token contract address
const result1 = await acreModule.registerYieldBearingEthereumAddress(
  "0x1234567890123456789012345678901234567890", // Ethereum parent account address
  "0x1234567890123456789012345678901234567890", // Token contract address
);

// Register with token ticker
const result2 = await acreModule.registerYieldBearingEthereumAddress(
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  undefined,
  "ethereum/erc20/acreBTC", // Token ticker with full path
);

// Register with metadata
const result3 = await acreModule.registerYieldBearingEthereumAddress(
  "0x9876543210987654321098765432109876543210",
  "0x1234567890123456789012345678901234567890",
  undefined,
  { source: "ACRE protocol", userId: "12345" },
);
```

#### Supported Tokens

For testing and development, you can use these well-known token contract addresses:

- **ACRE Bitcoin (acreBTC)**: is the Default token for ACRE protocol aimed to be used here
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

#### Behavior

- Creates a parent Ethereum account for the provided address
- Creates a token account linked to the specified token contract
- Both accounts are immediately visible in Ledger Live
- Handles duplicate registrations gracefully (returns existing account info)
- Validates Ethereum address format
- Provides proper error handling and user feedback
- Automatically generates unique account names with suffixes for multiple registrations
- Platform-aware Redux dispatching (ADD_ACCOUNT for mobile, REPLACE_ACCOUNTS for desktop)

#### Error Handling

The function will throw an error if:

- The Ethereum address format is invalid
- Neither `tokenContractAddress` nor `tokenTicker` is provided
- The token contract address is invalid or not supported
- The token ticker is not found in the cryptoassets database
- There's an issue with the Ledger Live integration
- The action dispatcher is not available

## Installation

```bash
npm install @ledgerhq/wallet-api-acre-module
```

## Dependencies

- `@ledgerhq/wallet-api-client`: Core Wallet API client functionality
- `@ledgerhq/wallet-api-core`: Core types and utilities
- `@ledgerhq/types-live`: Ledger Live type definitions
- `@ledgerhq/types-cryptoassets`: Cryptocurrency type definitions

## Testing

The module includes comprehensive tests covering:

- Message signing (success and error cases)
- Transaction signing and broadcasting
- Account registration (mobile and desktop platforms)
- Error handling and validation
- Platform-specific Redux dispatching

Run tests with:

```bash
pnpm jest src/wallet-api/ACRE/server.test.ts
```
