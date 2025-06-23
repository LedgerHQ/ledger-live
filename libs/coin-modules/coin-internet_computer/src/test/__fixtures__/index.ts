import { NeuronsData } from "@zondax/ledger-live-icp/neurons";
import { ICPAccount, ICPAccountRaw } from "../../types";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Sample account identifier
export const SAMPLE_ACCOUNT_ID =
  "046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf";

// Sample ICP address
export const SAMPLE_ICP_ADDRESS =
  "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";

// Sample balance response
export const SAMPLE_BALANCE = BigInt("1000000000"); // 10 ICP in e8s (1 ICP = 100,000,000 e8s)

// Sample block height
export const SAMPLE_BLOCK_HEIGHT = BigInt("1234567");

// Sample public key for testing
export const SAMPLE_PUBLIC_KEY = "sample_public_key_for_testing_0123456789abcdef";

// Sample neuron addresses for testing staking operations
export const SAMPLE_NEURON_ADDRESS_1 = "neuron_address_1_for_staking_test";
export const SAMPLE_NEURON_ADDRESS_2 = "neuron_address_2_for_topup_test";

// Sample transactions with various scenarios
export const SAMPLE_TRANSACTIONS = [
  {
    id: BigInt("1001"),
    transaction: {
      memo: BigInt("12345"),
      icrc1_memo: [],
      operation: {
        Transfer: {
          to: "recipient_address",
          fee: { e8s: BigInt("10000") },
          from: SAMPLE_ICP_ADDRESS,
          amount: { e8s: BigInt("100000000") },
          spender: [],
        },
      },
      created_at_time: [],
      timestamp: [{ timestamp_nanos: BigInt("1640995200000000000") }], // 2022-01-01
    },
  },
  {
    id: BigInt("1002"),
    transaction: {
      memo: BigInt("67890"),
      icrc1_memo: [],
      operation: {
        Transfer: {
          to: SAMPLE_ICP_ADDRESS,
          fee: { e8s: BigInt("10000") },
          from: "sender_address",
          amount: { e8s: BigInt("50000000") },
          spender: [],
        },
      },
      created_at_time: [],
      timestamp: [{ timestamp_nanos: BigInt("1640995260000000000") }], // 2022-01-01 + 1min
    },
  },
];

// Sample neuron staking transaction
export const SAMPLE_NEURON_STAKING_TRANSACTION = {
  id: BigInt("1003"),
  transaction: {
    memo: BigInt("100"), // Non-zero memo indicates staking
    icrc1_memo: [],
    operation: {
      Transfer: {
        to: SAMPLE_NEURON_ADDRESS_1,
        fee: { e8s: BigInt("10000") },
        from: SAMPLE_ICP_ADDRESS,
        amount: { e8s: BigInt("200000000") },
        spender: [],
      },
    },
    created_at_time: [],
    timestamp: [{ timestamp_nanos: BigInt("1640995320000000000") }], // 2022-01-01 + 2min
  },
};

// Sample neuron top-up transaction (zero memo)
export const SAMPLE_NEURON_TOPUP_TRANSACTION = {
  id: BigInt("1004"),
  transaction: {
    memo: BigInt("0"), // Zero memo indicates top-up
    icrc1_memo: [],
    operation: {
      Transfer: {
        to: SAMPLE_NEURON_ADDRESS_2,
        fee: { e8s: BigInt("10000") },
        from: SAMPLE_ICP_ADDRESS,
        amount: { e8s: BigInt("150000000") },
        spender: [],
      },
    },
    created_at_time: [],
    timestamp: [{ timestamp_nanos: BigInt("1640995380000000000") }], // 2022-01-01 + 3min
  },
};

// Transaction with non-Transfer operation (should be filtered out)
export const SAMPLE_NON_TRANSFER_TRANSACTION = {
  id: BigInt("1005"),
  transaction: {
    memo: BigInt("99999"),
    icrc1_memo: [],
    operation: {
      Mint: {
        to: SAMPLE_ICP_ADDRESS,
        amount: { e8s: BigInt("1000000") },
      },
    },
    created_at_time: [],
    timestamp: [{ timestamp_nanos: BigInt("1640995440000000000") }], // 2022-01-01 + 4min
  },
};

// Sample query blocks response
export const SAMPLE_QUERY_BLOCKS_RESPONSE = {
  chain_length: SAMPLE_BLOCK_HEIGHT,
  blocks: [],
};

// Sample get account identifier transactions response - with empty transactions to prevent recursion
export const SAMPLE_GET_ACCOUNT_TRANSACTIONS_RESPONSE = {
  Ok: {
    transactions: [], // Empty to prevent recursion in tests
    oldest_tx_id: [BigInt("1000")],
  },
};

// Sample get account identifier transactions response with transactions for specific tests
export const SAMPLE_GET_ACCOUNT_TRANSACTIONS_WITH_DATA = {
  Ok: {
    transactions: SAMPLE_TRANSACTIONS,
    oldest_tx_id: [BigInt("1000")],
  },
};

// Sample get account identifier transactions response with staking transactions
export const SAMPLE_GET_ACCOUNT_TRANSACTIONS_WITH_STAKING = {
  Ok: {
    transactions: [SAMPLE_NEURON_STAKING_TRANSACTION, SAMPLE_NEURON_TOPUP_TRANSACTION],
    oldest_tx_id: [BigInt("1000")],
  },
};

// Sample get account identifier transactions response with mixed transaction types
export const SAMPLE_GET_ACCOUNT_TRANSACTIONS_MIXED = {
  Ok: {
    transactions: [
      ...SAMPLE_TRANSACTIONS,
      SAMPLE_NEURON_STAKING_TRANSACTION,
      SAMPLE_NEURON_TOPUP_TRANSACTION,
      SAMPLE_NON_TRANSFER_TRANSACTION,
    ],
    oldest_tx_id: [BigInt("1000")],
  },
};

// Sample balance query response
export const SAMPLE_BALANCE_RESPONSE = SAMPLE_BALANCE;

// Sample account shapes for testing
export const SAMPLE_ACCOUNT_SHAPE_INFO = {
  currency: {
    type: "CryptoCurrency" as const,
    id: "internet_computer" as const,
    coinType: 223, // CoinType.ICP
    name: "Internet Computer",
    managerAppName: "InternetComputer",
    ticker: "ICP",
    scheme: "internet_computer",
    color: "#e1effa",
    family: "internet_computer" as const,
    units: [
      {
        name: "ICP",
        code: "ICP",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://dashboard.internetcomputer.org/transaction/$hash",
        address: "https://dashboard.internetcomputer.org/account/$address",
      },
    ],
  },
  address: SAMPLE_ICP_ADDRESS,
  index: 0,
  derivationPath: "44'/223'/0'/0/0",
  derivationMode: "" as const,
  rest: {
    publicKey: SAMPLE_PUBLIC_KEY,
  },
};

// Sample NeuronsData for testing
export const SAMPLE_NEURONS_DATA = NeuronsData.empty();

export const INITIAL_ACCOUNT_ID = "js:2:internet_computer:sample_xpub:";
export const SAMPLE_INITIAL_ACCOUNT = {
  id: INITIAL_ACCOUNT_ID,
  xpub: SAMPLE_PUBLIC_KEY,
  blockHeight: 1000000,
  operations: [
    {
      id: "existing_op_1",
      hash: "existing_hash_1",
      type: "IN",
      value: "5000000",
      fee: "10000",
      date: new Date("2022-01-01"),
      recipients: [SAMPLE_ICP_ADDRESS],
      senders: ["some_sender"],
    },
  ],
  neurons: SAMPLE_NEURONS_DATA,
} as unknown as ICPAccount; // Type assertion for test fixtures

// Mock agent response for successful queries
export const createMockAgentResponse = (_data: unknown) => ({
  status: "replied" as const,
  reply: {
    arg: new Uint8Array(),
  },
});

// Mock agent response for failed queries
export const createMockAgentErrorResponse = (status: string = "rejected") => ({
  status,
  reject_code: 4,
  reject_message: "Query failed",
});

// Mock fetch response for successful broadcasts
export const createMockFetchResponse = (status: number = 200, data?: ArrayBuffer) => ({
  status,
  arrayBuffer: jest.fn().mockResolvedValue(data || new ArrayBuffer(8)),
  text: jest.fn().mockResolvedValue(""),
});

// Mock fetch response for failed broadcasts
export const createMockFetchErrorResponse = (
  status: number = 400,
  message: string = "Bad Request",
) => ({
  status,
  arrayBuffer: jest.fn().mockRejectedValue(new Error("Network error")),
  text: jest.fn().mockResolvedValue(message),
});

export const ICP_CURRENCY_MOCK: CryptoCurrency = getCryptoCurrencyById("internet_computer");
export const VALID_ADDRESS_0 = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
export const VALID_ADDRESS_1 = "fdb7db0d3ae67368cb5010b7de7d98566c072f0a4eda871f45cd6582bf08aeb4";

export const getEmptyAccount = (currency: CryptoCurrency): ICPAccount => ({
  id: `js:2:${currency.id}:test:`,
  seedIdentifier: "test",
  derivationMode: "",
  index: 0,
  pendingOperations: [],
  lastSyncDate: new Date("2021-01-01"),
  xpub: "test",
  freshAddress: "test",
  freshAddressPath: "44'/223'/0'/0/0",
  currency,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: new Date("2021-01-01"),
  blockHeight: 0,
  operations: [],
  subAccounts: [],
  neurons: SAMPLE_NEURONS_DATA,
  operationsCount: 0,
  balanceHistoryCache: {
    HOUR: {
      latestDate: null,
      balances: [],
    },
    DAY: {
      latestDate: null,
      balances: [],
    },
    WEEK: {
      latestDate: null,
      balances: [],
    },
  },
  swapHistory: [],
  type: "Account",
  used: false,
});

export const getEmptyAccountRaw = (currency: CryptoCurrency): ICPAccountRaw => ({
  id: `js:2:${currency.id}:test:`,
  seedIdentifier: "test",
  derivationMode: "",
  index: 0,
  neuronsData: {
    fullNeurons: "serialized_full_neurons",
    neuronInfos: "serialized_neuron_infos",
    lastUpdated: 0,
  },
  freshAddress: "test",
  freshAddressPath: "44'/223'/0'/0/0",
  balance: "0",
  spendableBalance: "0",
  creationDate: "2021-01-01",
  blockHeight: 0,
  currencyId: currency.id,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: "2021-01-01",
  balanceHistoryCache: {
    HOUR: {
      latestDate: null,
      balances: [],
    },
    DAY: {
      latestDate: null,
      balances: [],
    },
    WEEK: {
      latestDate: null,
      balances: [],
    },
  },
  swapHistory: [],
});
