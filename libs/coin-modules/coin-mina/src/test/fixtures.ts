import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { MinaUnsignedTransaction } from "@ledgerhq/coin-mina/types";
import { MinaSigner } from "@ledgerhq/coin-mina/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { DeviceId } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { RosettaBlockInfoResponse, RosettaTransaction } from "../api/rosetta/types";
import { Transaction } from "../types";

// Mock account data
export const mockAccountData = {
  blockHeight: 123,
  balance: new BigNumber(1000),
  spendableBalance: new BigNumber(900),
};

// Mock block info
export const mockBlockInfo: RosettaBlockInfoResponse = {
  block: {
    block_identifier: { index: 123, hash: "block_hash" },
    parent_block_identifier: { index: 122, hash: "parent_block_hash" },
    timestamp: 1672531200000,
  },
};

/**
 * Creates a mock Rosetta transaction for testing
 */
export const createMockTxn = (options: {
  type: string;
  senderAddress: string;
  receiverAddress: string;
  status: "Success" | "Failed";
  amount?: string;
  fee?: string;
  memo?: string;
}): RosettaTransaction => {
  const {
    type,
    senderAddress,
    receiverAddress,
    amount = "1000",
    fee = "100",
    memo = "test memo",
    status,
  } = options;

  const operations: RosettaTransaction["transaction"]["operations"] = [];

  if (type !== "REDELEGATE") {
    // Add fee operation for payment transactions
    operations.push({
      type: "fee_payment",
      amount: { value: fee, currency: { symbol: "MINA", decimals: 9 } },
      status,
      account: { address: senderAddress, metadata: { token_id: "MINA" } },
      operation_identifier: { index: 0 },
    });

    operations.push({
      type: "payment_source_dec",
      status,
      account: { address: senderAddress, metadata: { token_id: "MINA" } },
      operation_identifier: { index: 1 },
    });

    operations.push({
      type: "payment_receiver_inc",
      amount: { value: amount, currency: { symbol: "MINA", decimals: 9 } },
      status,
      account: { address: receiverAddress, metadata: { token_id: "MINA" } },
      operation_identifier: { index: 2 },
    });
  } else {
    // Delegate change operation
    operations.push({
      type: "delegate_change",
      status,
      account: { address: senderAddress, metadata: { token_id: "MINA" } },
      operation_identifier: { index: 0 },
    });
  }

  return {
    transaction: {
      transaction_identifier: { hash: "tx_hash" },
      operations,
      metadata: { memo },
    },
    block_identifier: { index: 123, hash: "block_hash" },
    timestamp: 1672531200000,
  };
};

/**
 * Creates a mock account info object for testing
 */
export const createMockAccountInfo = (): AccountShapeInfo<Account> => ({
  address: "test_address",
  index: 0,
  derivationPath: "m/44'/12586'/0'/0/0",
  initialAccount: {
    operations: [],
    type: "Account",
    id: "account_id",
    seedIdentifier: "seed_identifier",
    derivationMode: "minabip44",
    index: 0,
    freshAddress: "fresh_address",
    freshAddressPath: "fresh_address_path",
    used: true,
    balance: new BigNumber(1000),
    spendableBalance: new BigNumber(900),
    creationDate: new Date(),
    blockHeight: 123,
    currency: getCryptoCurrencyById("mina") as CryptoCurrency,
    operationsCount: 0,
    pendingOperations: [],
    lastSyncDate: new Date(),
    subAccounts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    syncHash: undefined,
    nfts: [],
  },
  currency: getCryptoCurrencyById("mina") as CryptoCurrency,
  derivationMode: "minabip44",
});

/**
 * Creates a mock Mina account for testing
 */
export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  id: "mock_account_id",
  freshAddress: "B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc",
  freshAddressPath: "44'/12586'/0'/0/0",
  type: "Account",
  seedIdentifier: "seed_identifier",
  derivationMode: "minabip44",
  index: 0,
  used: true,
  balance: new BigNumber(1000),
  spendableBalance: new BigNumber(900),
  creationDate: new Date(),
  blockHeight: 123,
  currency: getCryptoCurrencyById("mina") as CryptoCurrency,
  operationsCount: 0,
  pendingOperations: [],
  lastSyncDate: new Date(),
  subAccounts: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  syncHash: undefined,
  nfts: [],
  operations: [],
  ...overrides,
});

/**
 * Creates a mock Mina transaction for testing
 */
export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  family: "mina",
  amount: new BigNumber(1000),
  recipient: "B62qr5cXFjdnZXYxP5dEwRY7wENxcod4Q2oLxUDiq1QrBXZZyxMH8q4",
  fees: {
    fee: new BigNumber(10),
    accountCreationFee: new BigNumber(0),
  },
  memo: "test memo",
  nonce: 1,
  ...overrides,
});

/**
 * Creates a mock unsigned transaction for testing
 */
export const createMockUnsignedTransaction = (
  account: Partial<Account> = createMockAccount(),
  transaction: Partial<Transaction> = createMockTransaction(),
): MinaUnsignedTransaction => ({
  txType: 0,
  senderAccount: 0,
  senderAddress: account.freshAddress!,
  receiverAddress: transaction.recipient!,
  amount: transaction.amount!.toNumber(),
  fee: transaction.fees!.fee.toNumber(),
  nonce: transaction.nonce!,
  memo: transaction.memo!,
  networkId: 1,
});

/**
 * Creates a mock device ID for testing
 */
export const mockDeviceId: DeviceId = "mock_device_id";

/**
 * Creates a mock signer context for testing
 */
export const createMockSignerContext = (
  signatureResponse: { returnCode: string; signature: string } = {
    returnCode: "0x9000",
    signature: "mock_raw_signature",
  },
): SignerContext<MinaSigner> =>
  jest.fn().mockImplementation((_deviceId, cb) => {
    const mockSigner: MinaSigner = {
      getAddress: jest.fn(),
      signTransaction: jest.fn().mockResolvedValue(signatureResponse),
    };
    return cb(mockSigner);
  });

// ... existing code ...
