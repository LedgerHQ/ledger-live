import BigNumber from "bignumber.js";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type { Transaction, CasperOperation } from "../types";
import { getEstimatedFees } from "../bridge/bridgeHelpers/fee";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES } from "../consts";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { ITxnHistoryData } from "../api/types";
import { DerivationMode } from "@ledgerhq/types-live";

/**
 * Sample Casper addresses for testing
 */
export const TEST_ADDRESSES = {
  // Sample public key for SECP256K1 derivation
  SECP256K1: "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581",
  // Sample recipient address for SECP256K1 format
  RECIPIENT_SECP256K1: "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB",
  // Sample recipient address for ED25519 format
  RECIPIENT_ED25519: "01e28f293af356e7a15068e535c248ec07c887b2ab7a5d9557037a0e998e5d97bf",
  // Invalid address for negative tests
  INVALID: "notavalidaddress",
};

/**
 * Sample transaction hashes for testing
 */
export const TEST_TRANSACTION_HASHES = {
  VALID: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  PENDING: "pending0123456789abcdef0123456789abcdef0123456789abcdef01234567",
  FAILED: "failed00123456789abcdef0123456789abcdef0123456789abcdef01234567",
};

/**
 * Sample transfer IDs for testing
 */
export const TEST_TRANSFER_IDS = {
  VALID: "123456",
  NUMERIC: "654321",
  INVALID: "not-a-valid-id",
};

/**
 * Create a mock Casper account for testing
 *
 * @param options Optional parameters to override default values
 * @returns A mock Casper account
 */
export const createMockAccount = (options?: Partial<Account>): Account => {
  const seedIdentifier = options?.seedIdentifier || TEST_ADDRESSES.SECP256K1;
  const currency = getCryptoCurrencyById("casper");

  const account: Account = {
    id: `js:2:casper:${seedIdentifier}:casper_wallet`,
    seedIdentifier,
    derivationMode: "casper_wallet",
    index: options?.index || 0,
    freshAddress: options?.freshAddress || seedIdentifier,
    freshAddressPath: options?.freshAddressPath || "44'/506'/0'/0/1",
    blockHeight: options?.blockHeight || 0,
    balance:
      options?.balance instanceof BigNumber
        ? options.balance
        : new BigNumber(options?.balance || "10000000000"), // 10 CSPR
    spendableBalance:
      options?.spendableBalance instanceof BigNumber
        ? options.spendableBalance
        : new BigNumber(options?.spendableBalance || "10000000000"), // 10 CSPR
    operations: options?.operations || [],
    pendingOperations: options?.pendingOperations || [],
    type: "Account",
    swapHistory: [],
    syncHash: undefined,
    nfts: [],
    used: true,
    currency,
    operationsCount: 0,
    subAccounts: [],
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };

  return { ...account, ...options };
};

/**
 * Create a mock Casper transaction for testing
 *
 * @param options Optional parameters to override default values
 * @returns A mock Casper transaction
 */
export const createMockTransaction = (options?: Partial<Transaction>): Transaction => {
  const defaultFees = getEstimatedFees();

  const transaction: Transaction = {
    family: "casper",
    amount:
      options?.amount instanceof BigNumber
        ? options.amount
        : new BigNumber(options?.amount || CASPER_MINIMUM_VALID_AMOUNT_MOTES),
    recipient: options?.recipient || TEST_ADDRESSES.RECIPIENT_SECP256K1,
    fees: options?.fees instanceof BigNumber ? options.fees : defaultFees,
    transferId: options?.transferId,
    useAllAmount: options?.useAllAmount || false,
  };

  return { ...transaction, ...options };
};

/**
 * Create a mock Casper operation for testing
 *
 * @param account The account associated with the operation
 * @param transaction The transaction details
 * @param options Optional parameters to override default values
 * @returns A mock Casper operation
 */
export const createMockOperation = (
  account: Account,
  transaction: Transaction,
  options?: Partial<Operation>,
): CasperOperation => {
  const hash = options?.hash || "0x" + Math.random().toString(16).substring(2, 10);
  const type = (options?.type as OperationType) || "OUT";

  const operation: CasperOperation = {
    id: options?.id || encodeOperationId(account.id, hash, type),
    hash,
    type,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    blockHash: options?.blockHash || null,
    blockHeight: options?.blockHeight || null,
    value: transaction.amount.plus(transaction.fees),
    fee: transaction.fees,
    date: options?.date || new Date(),
    extra: {
      transferId: transaction.transferId,
    },
    nftOperations: [],
    subOperations: [],
  };

  return { ...operation, ...options } as CasperOperation;
};

/**
 * Creates a set of accounts with different balances and statuses for comprehensive testing
 *
 * @returns An array of mock Casper accounts
 */
export const createMockAccountSet = (): Account[] => {
  return [
    // Standard account with balance
    createMockAccount(),

    // Empty account
    createMockAccount({
      balance: new BigNumber("0"),
      spendableBalance: new BigNumber("0"),
    }),

    // Account with pending operations
    createMockAccount({
      pendingOperations: [
        createMockOperation(
          createMockAccount(),
          createMockTransaction({ amount: new BigNumber("500000000") }),
          { type: "OUT", id: "pending-op-1" },
        ),
      ],
    }),

    // Account with high balance
    createMockAccount({
      balance: new BigNumber("100000000000000"), // 100,000 CSPR
      spendableBalance: new BigNumber("100000000000000"),
    }),
  ];
};

/**
 * Creates a set of transactions with different parameters for validation testing
 *
 * @returns An array of mock Casper transactions
 */
export const createMockTransactionSet = (): Transaction[] => {
  return [
    // Standard valid transaction
    createMockTransaction({
      amount: new BigNumber("1000000000"), // 1 CSPR
    }),

    // Transaction with invalid recipient
    createMockTransaction({
      recipient: TEST_ADDRESSES.INVALID,
    }),

    // Transaction with zero amount (should fail validation)
    createMockTransaction({
      amount: new BigNumber("0"),
    }),

    // Transaction with very high amount (should trigger warnings)
    createMockTransaction({
      amount: new BigNumber("999000000000"), // 999 CSPR
    }),

    // Transaction with transfer ID
    createMockTransaction({
      transferId: TEST_TRANSFER_IDS.VALID,
    }),

    // Transaction with invalid transfer ID
    createMockTransaction({
      transferId: TEST_TRANSFER_IDS.INVALID,
    }),

    // Transaction with useAllAmount flag
    createMockTransaction({
      useAllAmount: true,
    }),
  ];
};

/**
 * Creates a set of operations with different types and statuses for testing
 *
 * @param account The account to associate with the operations
 * @returns An array of mock Casper operations
 */
export const createMockOperationSet = (account: Account): CasperOperation[] => {
  const standardTx = createMockTransaction({
    amount: new BigNumber("1000000000"),
  });

  const largeTx = createMockTransaction({
    amount: new BigNumber("5000000000"),
  });

  const smallTx = createMockTransaction({
    amount: new BigNumber("100000000"),
  });

  const transferIdTx = createMockTransaction({
    transferId: TEST_TRANSFER_IDS.VALID,
  });

  // Create operations with different dates for sorting tests
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return [
    // Standard OUT operation
    createMockOperation(account, standardTx, {
      type: "OUT",
      hash: "0xoutoperation1",
      date: now,
    }),

    // IN operation
    createMockOperation(account, standardTx, {
      type: "IN",
      hash: "0xinoperation1",
      date: yesterday,
      senders: [TEST_ADDRESSES.RECIPIENT_SECP256K1], // Override sender
    }),

    // Large amount operation
    createMockOperation(account, largeTx, {
      type: "OUT",
      hash: "0xoutlarge1",
      date: lastWeek,
    }),

    // Small amount operation
    createMockOperation(account, smallTx, {
      type: "OUT",
      hash: "0xoutsmall1",
      date: lastMonth,
    }),

    // Operation with transfer ID
    createMockOperation(account, transferIdTx, {
      type: "OUT",
      hash: "0xtransferid1",
      date: lastMonth,
    }),

    // Operation with block height
    createMockOperation(account, standardTx, {
      type: "OUT",
      hash: "0xwithblock1",
      blockHeight: 12345,
      blockHash: "0xblockhash123",
      date: lastMonth,
    }),
  ];
};

/**
 * Creates a mock signed operation for testing broadcast functionality
 *
 * @param account The account associated with the operation
 * @param transaction The transaction to create the signed operation from
 * @param options Optional parameters to override default values
 * @returns A mock signed operation
 */
export const createMockSignedOperation = (
  account: Account,
  transaction: Transaction,
  options?: {
    signature?: string;
    rawTxJson?: object;
    operationOptions?: Partial<Operation>;
  },
) => {
  const operation = createMockOperation(account, transaction, options?.operationOptions);

  return {
    signature: options?.signature || "deadbeef1234567890abcdef",
    operation,
    rawData: {
      tx: JSON.stringify(
        options?.rawTxJson || {
          hash: TEST_TRANSACTION_HASHES.VALID,
          header: {
            account: account.freshAddress,
            timestamp: new Date().getTime(),
          },
          payment: {
            target: transaction.recipient,
            amount: transaction.amount.toString(),
          },
          fee: transaction.fees.toString(),
        },
      ),
    },
  };
};

/**
 * Creates mock data for testing account shape functionality
 *
 * @returns Object containing mock data for account shape tests
 */
export const createMockAccountShapeData = () => {
  const mockAddress = TEST_ADDRESSES.SECP256K1;
  const mockCurrency = getCryptoCurrencyById("casper");
  const mockDerivationMode: DerivationMode = "casper_wallet";
  const mockAccountInfo = {
    address: mockAddress,
    currency: mockCurrency,
    derivationMode: mockDerivationMode,
    index: 0,
    derivationPath: "44'/506'/0'/0/0",
  };

  const mockAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: mockCurrency.id,
    xpubOrAddress: mockAddress,
    derivationMode: mockDerivationMode,
  });

  const mockBlockHeight = 12345;
  const mockPurseUref = "uref-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef-007";
  const mockAccountHash =
    "account-hash-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const mockBalance = new BigNumber("1000000000");

  const mockTxs: ITxnHistoryData[] = [
    {
      deploy_hash: "deploy-hash-1",
      block_hash: "block-hash-1",
      caller_public_key: mockAddress,
      execution_type_id: 1,
      cost: "10000",
      payment_amount: "100000000",
      timestamp: "2023-01-01T12:00:00Z",
      status: "success",
      args: {
        id: {
          parsed: 12345,
          cl_type: {
            Option: "U64",
          },
        },
        amount: {
          parsed: "500000000",
          cl_type: "U512",
        },
        target: {
          parsed: TEST_ADDRESSES.RECIPIENT_SECP256K1,
          cl_type: "PublicKey",
        },
      },
      amount: "500000000",
    },
  ];

  const mockOperations = [
    {
      id: "mock-operation-id",
      hash: "deploy-hash-1",
      type: "OUT",
      value: new BigNumber("550000000"),
      fee: new BigNumber("50000000"),
      blockHeight: 12345,
      blockHash: null,
      hasFailed: false,
      accountId: mockAccountId,
      senders: [mockAccountHash],
      recipients: ["recipient-account-hash"],
      date: new Date("2023-01-01T12:00:00Z"),
      extra: {
        transferId: "12345",
      },
    },
  ];

  return {
    mockAddress,
    mockCurrency,
    mockDerivationMode,
    mockAccountInfo,
    mockAccountId,
    mockBlockHeight,
    mockPurseUref,
    mockAccountHash,
    mockBalance,
    mockTxs,
    mockOperations,
  };
};
