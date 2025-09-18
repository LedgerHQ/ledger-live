import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { AccountIdentifier, HttpHandler, PublicKey, RpcClient, Transaction } from "casper-js-sdk";
import {
  fetchAccountStateInfo,
  fetchBalance,
  fetchBlockHeight,
  fetchTxs,
  broadcastTx,
  getCasperNodeRpcClient,
} from ".";
import { getCoinConfig } from "../config";
import { TEST_ADDRESSES } from "../test/fixtures";
import { ITxnHistoryData, RpcError, IndexerResponseRoot } from "./types";
import { NodeErrorCodeAccountNotFound } from "../consts";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

// Constants
const MOCK_NODE_URL = "https://mock.casper.node";
const MOCK_INDEXER_URL = "https://mock.casper.indexer";
const MOCK_PUBLIC_KEY = TEST_ADDRESSES.SECP256K1;
const MOCK_PURSE_UREF = "uref-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef-007";
const MOCK_ACCOUNT_HASH =
  "account-hash-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const DEFAULT_LIMIT = 100;

// Mock dependencies
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));

// Type definitions for mocked objects
type MockedPublicKey = {
  fromHex: () => { fromHex: boolean };
};

type MockedAccountInfo = {
  account: {
    accountHash: { toHex: () => string };
    mainPurse: { toPrefixedString: () => string };
  };
};

type MockedStateRootHash = {
  stateRootHash: { toHex: () => string };
};

type MockedBalance = {
  balanceValue: string;
};

type MockedBlock = {
  block: { height: number };
};

type MockedTransactionHash = {
  transactionHash: { toHex: () => string };
};

type MockedNetworkResponse<T> = {
  data: IndexerResponseRoot<T>;
  status: number;
};

type CasperCoinConfig = {
  infra: {
    API_CASPER_NODE_ENDPOINT: string;
    API_CASPER_INDEXER: string;
  };
} & CurrencyConfig;

// Helper functions for creating mocks
const createMockRpcClient = (methodOverrides: Partial<Record<keyof RpcClient, jest.Mock>>) => {
  const defaultMethods = {
    getAccountInfo: jest.fn(),
    getStateRootHashLatest: jest.fn(),
    getBalanceByStateRootHash: jest.fn(),
    getLatestBlock: jest.fn(),
    putTransaction: jest.fn(),
  };

  // Create a combined mock with defaultMethods overridden by methodOverrides
  const combinedMock = { ...defaultMethods, ...methodOverrides };

  // Mock the RpcClient implementation to return our mock methods
  jest.mocked(RpcClient).mockImplementation(() => combinedMock as unknown as RpcClient);

  return combinedMock;
};

const createNetworkMock = <T>(responseData: T[], pageCount = 1, itemCount = responseData.length) =>
  ({
    data: {
      data: responseData,
      pageCount,
      itemCount,
      pages: [],
    },
    status: 200,
  }) as MockedNetworkResponse<T>;

// Mock casper-js-sdk
jest.mock("casper-js-sdk", () => {
  const originalModule = jest.requireActual("casper-js-sdk");
  return {
    ...originalModule,
    RpcClient: jest.fn(),
    HttpHandler: jest.fn(),
    AccountIdentifier: jest.fn(),
    PublicKey: {
      fromHex: jest.fn(),
    },
  };
});

describe("Casper API Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup config mock
    jest.mocked(getCoinConfig).mockReturnValue({
      infra: {
        API_CASPER_NODE_ENDPOINT: MOCK_NODE_URL,
        API_CASPER_INDEXER: MOCK_INDEXER_URL,
      },
    } as CasperCoinConfig);
  });

  describe("getCasperNodeRpcClient", () => {
    it("should create RPC client with correct URL", () => {
      getCasperNodeRpcClient();

      expect(HttpHandler).toHaveBeenCalledWith(MOCK_NODE_URL);
      expect(RpcClient).toHaveBeenCalled();
    });

    it("should throw error if API base URL is not available", () => {
      jest.mocked(getCoinConfig).mockReturnValueOnce({
        infra: {},
      } as CasperCoinConfig);

      expect(() => getCasperNodeRpcClient()).toThrow("API base URL not available");
    });
  });

  describe("fetchAccountStateInfo", () => {
    it("should fetch account state info successfully", async () => {
      // Mock PublicKey
      const mockPublicKeyInstance: MockedPublicKey = { fromHex: () => ({ fromHex: true }) };
      jest.mocked(PublicKey.fromHex).mockReturnValue(mockPublicKeyInstance as unknown as PublicKey);

      // Mock AccountIdentifier
      const mockAccountIdentifier = {};
      jest
        .mocked(AccountIdentifier)
        .mockReturnValue(mockAccountIdentifier as unknown as AccountIdentifier);

      // Mock RpcClient.getAccountInfo
      const mockGetAccountInfo = jest.fn().mockResolvedValue({
        account: {
          accountHash: { toHex: () => MOCK_ACCOUNT_HASH },
          mainPurse: { toPrefixedString: () => MOCK_PURSE_UREF },
        },
      } as MockedAccountInfo);

      createMockRpcClient({
        getAccountInfo: mockGetAccountInfo,
      });

      const result = await fetchAccountStateInfo(MOCK_PUBLIC_KEY);

      expect(PublicKey.fromHex).toHaveBeenCalledWith(MOCK_PUBLIC_KEY);
      expect(AccountIdentifier).toHaveBeenCalledWith(undefined, mockPublicKeyInstance);
      expect(mockGetAccountInfo).toHaveBeenCalledWith(null, mockAccountIdentifier);
      expect(result).toEqual({
        purseUref: MOCK_PURSE_UREF,
        accountHash: MOCK_ACCOUNT_HASH,
      });
    });

    it("should return undefined values when account not found", async () => {
      // Mock error with account not found status code
      const mockError = new Error("Account not found") as RpcError;
      mockError.statusCode = NodeErrorCodeAccountNotFound;

      createMockRpcClient({
        getAccountInfo: jest.fn().mockRejectedValue(mockError),
      });

      const result = await fetchAccountStateInfo(MOCK_PUBLIC_KEY);

      expect(result).toEqual({
        purseUref: undefined,
        accountHash: undefined,
      });
    });

    it("should throw error for other error cases", async () => {
      const mockError = new Error("General error");

      createMockRpcClient({
        getAccountInfo: jest.fn().mockRejectedValue(mockError),
      });

      await expect(fetchAccountStateInfo(MOCK_PUBLIC_KEY)).rejects.toThrow("General error");
    });
  });

  describe("fetchBalance", () => {
    it("should fetch balance successfully", async () => {
      const mockBalanceValue = "10000000000";
      const mockRootHash = "mocked-root-hash";

      // Create mock methods with implementations that return expected values
      const mockGetStateRootHashLatest = jest.fn().mockResolvedValue({
        stateRootHash: { toHex: () => mockRootHash },
      } as MockedStateRootHash);

      const mockGetBalanceByStateRootHash = jest.fn().mockResolvedValue({
        balanceValue: mockBalanceValue,
      } as MockedBalance);

      // Create the mock RPC client with our implementations
      const mockMethods = createMockRpcClient({
        getStateRootHashLatest: mockGetStateRootHashLatest,
        getBalanceByStateRootHash: mockGetBalanceByStateRootHash,
      });

      const result = await fetchBalance(MOCK_PURSE_UREF);

      expect(mockMethods.getStateRootHashLatest).toHaveBeenCalled();
      expect(mockMethods.getBalanceByStateRootHash).toHaveBeenCalledWith(
        MOCK_PURSE_UREF,
        mockRootHash,
      );
      expect(result).toEqual(new BigNumber(mockBalanceValue));
    });

    it("should throw error when balance fetch fails", async () => {
      const mockError = new Error("Failed to fetch balance");

      createMockRpcClient({
        getStateRootHashLatest: jest.fn().mockRejectedValue(mockError),
      });

      await expect(fetchBalance(MOCK_PURSE_UREF)).rejects.toThrow("Failed to fetch balance");
      expect(log).toHaveBeenCalledWith("error", "Failed to fetch balance", mockError);
    });
  });

  describe("fetchBlockHeight", () => {
    it("should fetch block height successfully", async () => {
      const mockHeight = 12345;

      createMockRpcClient({
        getLatestBlock: jest.fn().mockResolvedValue({
          block: { height: mockHeight },
        } as MockedBlock),
      });

      const result = await fetchBlockHeight();

      expect(result).toBe(mockHeight);
    });

    it("should throw error when block height fetch fails", async () => {
      const mockError = new Error("Failed to fetch block height");

      createMockRpcClient({
        getLatestBlock: jest.fn().mockRejectedValue(mockError),
      });

      await expect(fetchBlockHeight()).rejects.toThrow("Failed to fetch block height");
      expect(log).toHaveBeenCalledWith("error", "Failed to fetch block height", mockError);
    });
  });

  describe("fetchTxs", () => {
    const createMockTxData = (hash: string): ITxnHistoryData => ({
      deploy_hash: hash,
      block_hash: "block-hash-1",
      caller_public_key: MOCK_PUBLIC_KEY,
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
    });

    const mockTxData = [createMockTxData("deploy-hash-1")];

    const getExpectedNetworkCall = (page: number) => ({
      method: "GET",
      url: `${MOCK_INDEXER_URL}/accounts/${MOCK_PUBLIC_KEY}/ledgerlive-deploys?limit=${DEFAULT_LIMIT}&page=${page}`,
    });

    it("should fetch transactions successfully (single page)", async () => {
      jest.mocked(network).mockResolvedValueOnce(createNetworkMock(mockTxData));

      const result = await fetchTxs(MOCK_PUBLIC_KEY);

      expect(network).toHaveBeenCalledWith(getExpectedNetworkCall(1));
      expect(result).toEqual(mockTxData);
    });

    it("should fetch transactions successfully (multiple pages)", async () => {
      // Mock first page
      jest.mocked(network).mockResolvedValueOnce(createNetworkMock([mockTxData[0]], 2, 2));

      // Mock second page
      const secondPageTx = createMockTxData("deploy-hash-2");
      jest.mocked(network).mockResolvedValueOnce(createNetworkMock([secondPageTx], 2, 2));

      const result = await fetchTxs(MOCK_PUBLIC_KEY);

      expect(network).toHaveBeenCalledTimes(2);
      expect(network).toHaveBeenNthCalledWith(1, getExpectedNetworkCall(1));
      expect(network).toHaveBeenNthCalledWith(2, getExpectedNetworkCall(2));
      expect(result).toEqual([mockTxData[0], secondPageTx]);
    });

    it("should throw error when transactions fetch fails", async () => {
      const mockError = new Error("Failed to fetch transactions");
      jest.mocked(network).mockRejectedValueOnce(mockError);

      await expect(fetchTxs(MOCK_PUBLIC_KEY)).rejects.toThrow("Failed to fetch transactions");
      expect(log).toHaveBeenCalledWith("error", "Casper indexer error: ", mockError);
    });
  });

  describe("broadcastTx", () => {
    it("should broadcast transaction successfully", async () => {
      const mockTransaction = {} as Transaction;
      const mockTxHash = "0123456789abcdef";

      createMockRpcClient({
        putTransaction: jest.fn().mockResolvedValue({
          transactionHash: { toHex: () => mockTxHash },
        } as MockedTransactionHash),
      });

      const result = await broadcastTx(mockTransaction);

      expect(result).toBe(mockTxHash);
    });

    it("should throw error when broadcast fails", async () => {
      const mockTransaction = {} as Transaction;
      const mockError = new Error("Failed to broadcast transaction");

      createMockRpcClient({
        putTransaction: jest.fn().mockRejectedValue(mockError),
      });

      await expect(broadcastTx(mockTransaction)).rejects.toThrow("Failed to broadcast transaction");
      expect(log).toHaveBeenCalledWith("error", "Failed to broadcast transaction", mockError);
    });
  });
});
