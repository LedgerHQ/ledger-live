/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import {
  createMockBalanceResponse,
  createMockEstimatedFeesResponse,
  createMockTransactionResponse,
  createMockERC20Transfer,
  TEST_ADDRESSES,
  TEST_TRANSACTION_HASHES,
  TEST_BLOCK_HEIGHTS,
} from "../test/fixtures";
import {
  fetchBalances,
  fetchEstimatedFees,
  fetchBlockHeight,
  fetchTxs,
  fetchTxsWithPages,
  broadcastTx,
  fetchERC20TokenBalance,
  fetchERC20TransactionsWithPages,
} from "./api";

// Mock dependencies
jest.mock("@ledgerhq/logs");
jest.mock("@ledgerhq/live-network/network");
jest.mock("@ledgerhq/live-env");

const MOCK_API_URL = "https://mock.filecoin.api";
const mockedNetwork = network as jest.MockedFunction<typeof network>;
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>;

describe("Filecoin API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockedGetEnv.mockReturnValue(MOCK_API_URL);
  });

  describe("fetchBalances", () => {
    it("should fetch balance for a given address", async () => {
      const mockBalance = createMockBalanceResponse({
        total_balance: "1000000000000000000",
        spendable_balance: "900000000000000000",
        locked_balance: "100000000000000000",
      });

      mockedNetwork.mockResolvedValueOnce({ data: mockBalance, status: 200 });

      const result = await fetchBalances(TEST_ADDRESSES.F1_ADDRESS);

      expect(result).toEqual(mockBalance);
    });
  });

  describe("fetchEstimatedFees", () => {
    it("should fetch estimated fees for a transaction", async () => {
      const mockFees = createMockEstimatedFeesResponse({
        gas_limit: 1500000,
        gas_fee_cap: "150000",
        gas_premium: "125000",
        nonce: 5,
      });

      const request = {
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
      };

      mockedNetwork.mockResolvedValueOnce({ data: mockFees, status: 200 });

      const result = await fetchEstimatedFees(request);

      expect(result).toEqual(mockFees);
    });
  });

  describe("fetchBlockHeight", () => {
    it("should fetch current block height", async () => {
      const mockNetworkStatus = {
        current_block_identifier: {
          index: TEST_BLOCK_HEIGHTS.CURRENT,
          hash: "blockhash123",
        },
        genesis_block_identifier: {
          index: 0,
          hash: "genesis",
        },
        current_block_timestamp: Date.now(),
      };

      mockedNetwork.mockResolvedValueOnce({ data: mockNetworkStatus, status: 200 });

      const result = await fetchBlockHeight();

      expect(result.current_block_identifier.index).toBe(TEST_BLOCK_HEIGHTS.CURRENT);
    });
  });

  describe("fetchTxs", () => {
    it("should fetch transactions from specific height", async () => {
      const mockResponse = {
        txs: [createMockTransactionResponse()],
        metadata: { limit: 50, offset: 10 },
      };

      mockedNetwork.mockResolvedValueOnce({ data: mockResponse, status: 200 });

      await fetchTxs(TEST_ADDRESSES.F1_ADDRESS, 2500000, 10, 50);

      expect(mockedNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: expect.stringContaining("from_height=2500000&offset=10&limit=50"),
      });
    });
  });

  describe("fetchTxsWithPages", () => {
    it("should fetch all transactions with multi-page pagination", async () => {
      const firstPageTxs = Array.from({ length: 1000 }, (_, i) =>
        createMockTransactionResponse({ hash: `hash_${i}` }),
      );
      const secondPageTxs = Array.from({ length: 500 }, (_, i) =>
        createMockTransactionResponse({ hash: `hash_${1000 + i}` }),
      );

      mockedNetwork
        .mockResolvedValueOnce({ data: { txs: firstPageTxs, metadata: {} }, status: 200 })
        .mockResolvedValueOnce({ data: { txs: secondPageTxs, metadata: {} }, status: 200 });

      const result = await fetchTxsWithPages(TEST_ADDRESSES.F1_ADDRESS, 0);

      expect(result).toHaveLength(1500);
      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });
  });

  describe("broadcastTx", () => {
    it("should broadcast a signed transaction", async () => {
      const mockRequest = {
        message: {
          version: 0,
          to: TEST_ADDRESSES.RECIPIENT_F1,
          from: TEST_ADDRESSES.F1_ADDRESS,
          nonce: 5,
          value: "100000000000000000",
          gaslimit: 1000000,
          gasfeecap: "100000",
          gaspremium: "100000",
          method: 0,
          params: "",
        },
        signature: {
          type: 1,
          data: "signature_data_here",
        },
      };

      const mockResponse = {
        hash: TEST_TRANSACTION_HASHES.VALID,
      };

      mockedNetwork.mockResolvedValueOnce({ data: mockResponse, status: 200 });

      const result = await broadcastTx(mockRequest);

      expect(result).toEqual({
        hash: "bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa",
      });
    });
  });

  describe("fetchERC20TokenBalance", () => {
    it("should return 0 when no balance data is available", async () => {
      const mockResponse = {
        data: [],
      };

      mockedNetwork.mockResolvedValueOnce({ data: mockResponse, status: 200 });

      const result = await fetchERC20TokenBalance(
        TEST_ADDRESSES.F4_ADDRESS,
        TEST_ADDRESSES.ERC20_CONTRACT,
      );

      expect(result).toBe("0");
    });
  });

  describe("fetchERC20TransactionsWithPages", () => {
    it("should fetch all ERC20 transactions with pagination and sort by timestamp", async () => {
      const now = Math.floor(Date.now() / 1000);

      const firstPageTxs = Array.from({ length: 1000 }, (_, i) =>
        createMockERC20Transfer({
          id: `${i}`,
          timestamp: now - i,
        }),
      );

      const secondPageTxs = Array.from({ length: 300 }, (_, i) =>
        createMockERC20Transfer({
          id: `${1000 + i}`,
          timestamp: now - 1000 - i,
        }),
      );

      mockedNetwork
        .mockResolvedValueOnce({ data: { txs: firstPageTxs }, status: 200 })
        .mockResolvedValueOnce({ data: { txs: secondPageTxs }, status: 200 });

      const result = await fetchERC20TransactionsWithPages(TEST_ADDRESSES.F4_ADDRESS, 100);

      expect(result).toHaveLength(1300);
      expect(mockedNetwork).toHaveBeenCalledTimes(2);
      expect(result[0].timestamp).toBeGreaterThanOrEqual(result[1].timestamp);
    });
  });
});
