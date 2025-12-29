import { setup } from "../test/jest.mocks";
setup();
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  MAINNET_INDEX_CANISTER_ID,
} from "../consts";
import { broadcastTxn, fetchBalance, fetchBlockHeight, fetchTxns } from "./api";
import {
  SAMPLE_ACCOUNT_ID,
  SAMPLE_ICP_ADDRESS,
  SAMPLE_BALANCE,
  SAMPLE_BLOCK_HEIGHT,
  SAMPLE_GET_ACCOUNT_TRANSACTIONS_WITH_DATA,
  createMockFetchResponse,
  createMockFetchErrorResponse,
} from "../test/__fixtures__";
import BigNumber from "bignumber.js";

// Import the mocked modules to get access to the mock functions
import * as mockIcp from "@zondax/ledger-live-icp";
import * as mockUtils from "@zondax/ledger-live-icp/utils";
import * as mockAgent from "@zondax/ledger-live-icp/agent";

describe("api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchBalance", () => {
    it("should fetch balance successfully", async () => {
      const balance = await fetchBalance(SAMPLE_ICP_ADDRESS);

      expect(balance).toBeInstanceOf(BigNumber);
      expect(balance.toString()).toBe(SAMPLE_BALANCE.toString());
    });

    it("should return zero balance when query fails", async () => {
      // Mock the agent to return a failed response
      const mockAgentInstance = await (mockAgent.getAgent as jest.Mock)();
      mockAgentInstance.query.mockResolvedValueOnce({
        status: "rejected",
        reject_code: 4,
        reject_message: "Query failed",
      });

      const balance = await fetchBalance(SAMPLE_ICP_ADDRESS);
      expect(balance.toString()).toBe("0");
    });

    it("should return zero balance when decoding returns null", async () => {
      (mockUtils.fromNullable as jest.Mock).mockReturnValueOnce(undefined);

      const balance = await fetchBalance(SAMPLE_ICP_ADDRESS);
      expect(balance.toString()).toBe("0");
    });

    it("should handle different account identifiers", async () => {
      const balance1 = await fetchBalance(SAMPLE_ACCOUNT_ID);
      const balance2 = await fetchBalance(SAMPLE_ICP_ADDRESS);

      expect(balance1).toBeInstanceOf(BigNumber);
      expect(balance2).toBeInstanceOf(BigNumber);
    });
  });

  describe("fetchBlockHeight", () => {
    it("should fetch block height successfully", async () => {
      const blockHeight = await fetchBlockHeight();

      expect(blockHeight).toBeInstanceOf(BigNumber);
      expect(blockHeight.toString()).toBe(SAMPLE_BLOCK_HEIGHT.toString());
    });

    it("should throw error when query fails", async () => {
      const mockAgentInstance = await (mockAgent.getAgent as jest.Mock)();
      mockAgentInstance.query.mockResolvedValueOnce({
        status: "rejected",
        reject_code: 4,
        reject_message: "Query failed",
      });

      await expect(fetchBlockHeight()).rejects.toThrow("[ICP](fetchBlockHeight) Query failed");
    });

    it("should throw error when decoding fails", async () => {
      (mockUtils.fromNullable as jest.Mock).mockReturnValueOnce(undefined);

      await expect(fetchBlockHeight()).rejects.toThrow("[ICP](fetchBlockHeight) Decoding failed");
    });

    it("should use correct canister and method", async () => {
      const mockAgentInstance = await (mockAgent.getAgent as jest.Mock)();

      await fetchBlockHeight();

      expect(mockIcp.Principal.fromText).toHaveBeenCalledWith(MAINNET_LEDGER_CANISTER_ID);
      expect(mockAgentInstance.query).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          methodName: "query_blocks",
        }),
      );
    });
  });

  describe("fetchTxns", () => {
    it("should fetch transactions successfully with no recursion", async () => {
      const transactions = await fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(1000), BigInt(0));

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions).toEqual([]); // Empty because of our mock to prevent recursion
    });

    it("should fetch transactions with data when mocked correctly", async () => {
      // Mock decodeCanisterIdlFunc to return transactions with data
      (mockIcp.decodeCanisterIdlFunc as jest.Mock).mockReturnValueOnce([
        SAMPLE_GET_ACCOUNT_TRANSACTIONS_WITH_DATA,
      ]);

      const transactions = await fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(1000), BigInt(0));

      expect(Array.isArray(transactions)).toBe(true);
      // Since we have transactions, but prevent recursion, we should get the mock data
      expect(transactions.length).toBeGreaterThan(0);
    });

    it("should return empty array when startBlockHeight <= stopBlockHeight", async () => {
      const transactions = await fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(100), BigInt(200));
      expect(transactions).toEqual([]);
    });

    it("should return empty array when no transactions found", async () => {
      (mockIcp.decodeCanisterIdlFunc as jest.Mock).mockReturnValueOnce([
        {
          Ok: {
            transactions: [],
            oldest_tx_id: [],
          },
        },
      ]);

      const transactions = await fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(1000), BigInt(0));
      expect(transactions).toEqual([]);
    });

    it("should throw error when query fails", async () => {
      const mockAgentInstance = await (mockAgent.getAgent as jest.Mock)();
      mockAgentInstance.query.mockResolvedValueOnce({
        status: "rejected",
        reject_code: 4,
        reject_message: "Query failed",
      });

      await expect(fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(1000), BigInt(0))).rejects.toThrow(
        "[ICP](fetchTxns) Query failed",
      );
    });

    it("should throw error when decoding fails", async () => {
      (mockUtils.fromNullable as jest.Mock).mockReturnValueOnce(undefined);

      await expect(fetchTxns(SAMPLE_ICP_ADDRESS, BigInt(1000), BigInt(0))).rejects.toThrow(
        "[ICP](fetchTxns) Decoding failed",
      );
    });

    it("should use correct parameters and pagination", async () => {
      const startBlock = BigInt(1000);
      const stopBlock = BigInt(0);

      await fetchTxns(SAMPLE_ICP_ADDRESS, startBlock, stopBlock);

      expect(mockIcp.Principal.fromText).toHaveBeenCalledWith(MAINNET_INDEX_CANISTER_ID);
      expect(mockIcp.getCanisterIdlFunc).toHaveBeenCalledWith(
        expect.anything(),
        "get_account_identifier_transactions",
      );
      expect(mockIcp.encodeCanisterIdlFunc).toHaveBeenCalledWith(expect.anything(), [
        expect.objectContaining({
          account_identifier: SAMPLE_ICP_ADDRESS,
          start: [startBlock],
          max_results: BigInt(100), // FETCH_TXNS_LIMIT
        }),
      ]);
    });
  });

  describe("broadcastTxn", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it("should broadcast a transaction successfully", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      (global.fetch as jest.Mock).mockResolvedValue(createMockFetchResponse(200, mockArrayBuffer));

      const transaction = Buffer.from("0x1234567890", "hex");
      const canisterId = MAINNET_GOVERNANCE_CANISTER_ID;
      const result = await broadcastTxn(transaction, canisterId, "call");

      expect(result).toBe(mockArrayBuffer);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v3/canister/${canisterId}/call`),
        expect.objectContaining({
          method: "POST",
          body: transaction,
          headers: {
            "Content-Type": "application/cbor",
          },
        }),
      );
    });

    it("should handle read_state type", async () => {
      const mockArrayBuffer = new ArrayBuffer(16);
      (global.fetch as jest.Mock).mockResolvedValue(createMockFetchResponse(200, mockArrayBuffer));

      const transaction = Buffer.from("test_read_state", "utf8");
      const canisterId = MAINNET_LEDGER_CANISTER_ID;
      const result = await broadcastTxn(transaction, canisterId, "read_state");

      expect(result).toBe(mockArrayBuffer);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v3/canister/${canisterId}/read_state`),
        expect.objectContaining({
          method: "POST",
          body: transaction,
          headers: {
            "Content-Type": "application/cbor",
          },
        }),
      );
    });

    it("should throw error on failed broadcast (400 status)", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchErrorResponse(400, "Bad Request"),
      );

      const transaction = Buffer.from("0x1234567890", "hex");
      const canisterId = MAINNET_GOVERNANCE_CANISTER_ID;

      await expect(broadcastTxn(transaction, canisterId, "call")).rejects.toThrow(
        "Failed to broadcast transaction:",
      );
    });

    it("should throw error on failed broadcast (500 status)", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchErrorResponse(500, "Internal Server Error"),
      );

      const transaction = Buffer.from("0x1234567890", "hex");
      const canisterId = MAINNET_GOVERNANCE_CANISTER_ID;

      await expect(broadcastTxn(transaction, canisterId, "call")).rejects.toThrow(
        "Failed to broadcast transaction:",
      );
    });

    it("should handle different canister IDs", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      (global.fetch as jest.Mock).mockResolvedValue(createMockFetchResponse(200, mockArrayBuffer));

      const transaction = Buffer.from("test", "utf8");

      // Test with different canister IDs
      await broadcastTxn(transaction, MAINNET_GOVERNANCE_CANISTER_ID, "call");
      await broadcastTxn(transaction, MAINNET_LEDGER_CANISTER_ID, "call");
      await broadcastTxn(transaction, MAINNET_INDEX_CANISTER_ID, "call");

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(MAINNET_GOVERNANCE_CANISTER_ID),
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(MAINNET_LEDGER_CANISTER_ID),
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(MAINNET_INDEX_CANISTER_ID),
        expect.any(Object),
      );
    });

    it("should handle empty transaction buffer", async () => {
      const mockArrayBuffer = new ArrayBuffer(0);
      (global.fetch as jest.Mock).mockResolvedValue(createMockFetchResponse(200, mockArrayBuffer));

      const transaction = Buffer.alloc(0);
      const canisterId = MAINNET_GOVERNANCE_CANISTER_ID;
      const result = await broadcastTxn(transaction, canisterId, "call");

      expect(result).toBe(mockArrayBuffer);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: transaction,
        }),
      );
    });
  });
});
