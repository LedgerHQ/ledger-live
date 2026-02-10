import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction } from "../types/bridge";
import type {
  TransactionResponse,
  BalanceResponse,
  EstimatedFeesResponse,
  ERC20Transfer,
} from "../types/common";

/**
 * Sample Filecoin addresses for testing
 */
export const TEST_ADDRESSES = {
  // f1 address (SECP256K1)
  F1_ADDRESS: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
  // f4 address (delegated)
  F4_ADDRESS: "f410fkkld55ioe7qg24wvt7fu6pbknb56ht7ptloy",
  // Another f1 address for recipient
  RECIPIENT_F1: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
  // Another f4 address for recipient
  RECIPIENT_F4: "f410fagkr6pfqzd5q2kj42qrj54g3sxqjsrqn4fhoy",
  // ERC20 contract address (f4)
  ERC20_CONTRACT: "f410f3huuiyauahgjp7xjbvb7yfpuhvpyxvnqx3qy",
};

/**
 * Sample transaction hashes for testing
 */
export const TEST_TRANSACTION_HASHES = {
  VALID: "bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa",
};

/**
 * Sample block heights for testing
 */
export const TEST_BLOCK_HEIGHTS = {
  CURRENT: 3000000,
  RECENT: 2999999,
  OLD: 2500000,
};

/**
 * Create a mock Filecoin account for testing
 *
 * @param options Optional parameters to override default values
 * @returns A mock Filecoin account
 */
export const createMockAccount = (options?: Partial<Account>): Account => {
  const seedIdentifier = options?.seedIdentifier || TEST_ADDRESSES.F1_ADDRESS;

  // For Filecoin, we need to handle the currency ID appropriately
  // Using a mock currency structure similar to what getCryptoCurrencyById would return
  const mockCurrency = {
    type: "CryptoCurrency" as const,
    id: "filecoin",
    coinType: 461,
    name: "Filecoin",
    managerAppName: "Filecoin",
    ticker: "FIL",
    scheme: "filecoin",
    color: "#0090FF",
    family: "filecoin" as const,
    units: [
      {
        name: "FIL",
        code: "FIL",
        magnitude: 18,
      },
      {
        name: "attoFIL",
        code: "attoFIL",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://filfox.info/en/address/$address",
        tx: "https://filfox.info/en/message/$hash",
      },
    ],
  };

  const account: Account = {
    type: "Account",
    id:
      options?.id ||
      encodeAccountId({
        type: "js",
        version: "2",
        currencyId: "filecoin",
        xpubOrAddress: seedIdentifier,
        derivationMode: "",
      }),
    seedIdentifier,
    derivationMode: "",
    index: options?.index || 0,
    freshAddress: options?.freshAddress || seedIdentifier,
    freshAddressPath: options?.freshAddressPath || "44'/461'/0'/0/0",
    blockHeight: options?.blockHeight || TEST_BLOCK_HEIGHTS.CURRENT,
    balance:
      options?.balance instanceof BigNumber
        ? options.balance
        : new BigNumber(options?.balance || "1000000000000000000"), // 1 FIL
    spendableBalance:
      options?.spendableBalance instanceof BigNumber
        ? options.spendableBalance
        : new BigNumber(options?.spendableBalance || "1000000000000000000"), // 1 FIL
    operations: options?.operations || [],
    pendingOperations: options?.pendingOperations || [],
    currency: options?.currency || (mockCurrency as any),
    operationsCount: options?.operationsCount || 0,
    subAccounts: options?.subAccounts || [],
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    creationDate: options?.creationDate || new Date(),
    lastSyncDate: options?.lastSyncDate || new Date(),
    nfts: options?.nfts || [],
    used: true,
  };

  return { ...account, ...options };
};

/**
 * Create a mock Filecoin transaction for testing
 *
 * @param options Optional parameters to override default values
 * @returns A mock Filecoin transaction
 */
export const createMockTransaction = (options?: Partial<Transaction>): Transaction => {
  const transaction: Transaction = {
    family: "filecoin",
    amount:
      options?.amount instanceof BigNumber
        ? options.amount
        : new BigNumber(options?.amount || "100000000000000000"), // 0.1 FIL
    recipient: options?.recipient || TEST_ADDRESSES.RECIPIENT_F1,
    useAllAmount: options?.useAllAmount || false,
    nonce: options?.nonce || 0,
    method: options?.method || 0,
    version: options?.version || 0,
    params: options?.params,
    gasLimit: options?.gasLimit || new BigNumber(1000000),
    gasFeeCap: options?.gasFeeCap || new BigNumber("100000"),
    gasPremium: options?.gasPremium || new BigNumber("100000"),
  };

  return { ...transaction, ...options };
};

/**
 * Create a mock Filecoin operation for testing
 *
 * @param account The account associated with the operation
 * @param transaction The transaction details
 * @param options Optional parameters to override default values
 * @returns A mock Filecoin operation
 */
export const createMockOperation = (
  account: Account,
  transaction: Transaction,
  options?: Partial<Operation>,
): Operation => {
  const hash = options?.hash || TEST_TRANSACTION_HASHES.VALID;
  const type = (options?.type as OperationType) || "OUT";

  const fee = transaction.gasLimit.multipliedBy(transaction.gasFeeCap).plus(transaction.gasPremium);

  const operation: Operation = {
    id: options?.id || encodeOperationId(account.id, hash, type),
    hash,
    type,
    senders: options?.senders || [account.freshAddress],
    recipients: options?.recipients || [transaction.recipient],
    accountId: account.id,
    blockHash: options?.blockHash || null,
    blockHeight: options?.blockHeight || null,
    value: type === "OUT" ? transaction.amount.plus(fee) : transaction.amount,
    fee,
    date: options?.date || new Date(),
    extra: options?.extra || {},
    hasFailed: options?.hasFailed || false,
  };

  return { ...operation, ...options };
};

/**
 * Create a mock TokenAccount for testing ERC20 functionality
 *
 * @param parentAccount The parent Filecoin account
 * @param options Optional parameters to override default values
 * @returns A mock TokenAccount
 */
export const createMockTokenAccount = (
  parentAccount: Account,
  options?: Partial<TokenAccount>,
): TokenAccount => {
  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    id: options?.id || `${parentAccount.id}+${TEST_ADDRESSES.ERC20_CONTRACT}`,
    parentId: parentAccount.id,
    token: options?.token || {
      type: "TokenCurrency" as const,
      id: `filecoin/erc20/test_token`,
      contractAddress: TEST_ADDRESSES.ERC20_CONTRACT,
      parentCurrency: parentAccount.currency,
      tokenType: "erc20" as const,
      name: "Test Token",
      ticker: "TST",
      units: [
        {
          name: "TST",
          code: "TST",
          magnitude: 18,
        },
      ],
      disableCountervalue: false,
    },
    balance:
      options?.balance instanceof BigNumber
        ? options.balance
        : new BigNumber(options?.balance || "1000000000000000000"), // 1 TST
    spendableBalance:
      options?.spendableBalance instanceof BigNumber
        ? options.spendableBalance
        : new BigNumber(options?.spendableBalance || "1000000000000000000"),
    creationDate: options?.creationDate || new Date(),
    operationsCount: options?.operationsCount || 0,
    operations: options?.operations || [],
    pendingOperations: options?.pendingOperations || [],
    swapHistory: options?.swapHistory || [],
    balanceHistoryCache: options?.balanceHistoryCache || {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };

  return { ...tokenAccount, ...options };
};

/**
 * Create mock API response for balance
 *
 * @param options Optional parameters to override default values
 * @returns A mock BalanceResponse
 */
export const createMockBalanceResponse = (options?: Partial<BalanceResponse>): BalanceResponse => {
  return {
    total_balance: options?.total_balance || "1000000000000000000",
    spendable_balance: options?.spendable_balance || "1000000000000000000",
    locked_balance: options?.locked_balance || "0",
  };
};

/**
 * Create mock API response for transaction
 *
 * @param options Optional parameters to override default values
 * @returns A mock TransactionResponse
 */
export const createMockTransactionResponse = (
  options?: Partial<TransactionResponse>,
): TransactionResponse => {
  return {
    hash: options?.hash || TEST_TRANSACTION_HASHES.VALID,
    to: options?.to || TEST_ADDRESSES.RECIPIENT_F1,
    from: options?.from || TEST_ADDRESSES.F1_ADDRESS,
    amount: options?.amount || "100000000000000000",
    status: options?.status || "Ok",
    type: options?.type || "transfer",
    timestamp: options?.timestamp || Math.floor(Date.now() / 1000),
    height: options?.height || TEST_BLOCK_HEIGHTS.CURRENT,
    fee_data: options?.fee_data || {
      MinerFee: {
        MinerAddress: "f0123",
        Amount: "50000",
      },
      OverEstimationBurnFee: {
        BurnAddress: "f099",
        Amount: "25000",
      },
      BurnFee: {
        BurnAddress: "f099",
        Amount: "25000",
      },
      TotalCost: "100000",
    },
  };
};

/**
 * Create mock API response for estimated fees
 *
 * @param options Optional parameters to override default values
 * @returns A mock EstimatedFeesResponse
 */
export const createMockEstimatedFeesResponse = (
  options?: Partial<EstimatedFeesResponse>,
): EstimatedFeesResponse => {
  return {
    gas_limit: options?.gas_limit || 1000000,
    gas_fee_cap: options?.gas_fee_cap || "100000",
    gas_premium: options?.gas_premium || "100000",
    nonce: options?.nonce || 0,
  };
};

/**
 * Create mock ERC20 transfer for testing token functionality
 *
 * @param options Optional parameters to override default values
 * @returns A mock ERC20Transfer
 */
export const createMockERC20Transfer = (options?: Partial<ERC20Transfer>): ERC20Transfer => {
  const transfer: ERC20Transfer = {
    id: options?.id || "1",
    height: options?.height || TEST_BLOCK_HEIGHTS.CURRENT,
    type: options?.type || "erc20_transfer",
    status: options?.status || "Ok",
    to: options?.to || TEST_ADDRESSES.RECIPIENT_F4,
    from: options?.from || TEST_ADDRESSES.F4_ADDRESS,
    amount: options?.amount || "1000000000000000000",
    contract_address: options?.contract_address || TEST_ADDRESSES.ERC20_CONTRACT,
    timestamp: options?.timestamp || Math.floor(Date.now() / 1000),
    tx_hash: options?.tx_hash || TEST_TRANSACTION_HASHES.VALID,
  };

  if (options?.tx_cid !== undefined) {
    transfer.tx_cid = options.tx_cid;
  }

  return transfer;
};
