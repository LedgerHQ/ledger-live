import {
  setup,
  getMockedAPI,
  getMockedFramework,
  getMockedUtils,
  getMockedNeurons,
} from "../../test/jest.mocks";
setup();
import BigNumber from "bignumber.js";
import { SyncConfig } from "@ledgerhq/types-live";
import { getAccountShape } from "./account";
import {
  SAMPLE_ACCOUNT_ID,
  SAMPLE_ICP_ADDRESS,
  SAMPLE_PUBLIC_KEY,
  SAMPLE_BALANCE,
  SAMPLE_BLOCK_HEIGHT,
  SAMPLE_ACCOUNT_SHAPE_INFO,
  SAMPLE_INITIAL_ACCOUNT,
  SAMPLE_TRANSACTIONS,
  SAMPLE_NEURON_STAKING_TRANSACTION,
  SAMPLE_NEURON_TOPUP_TRANSACTION,
  SAMPLE_NON_TRANSFER_TRANSACTION,
  SAMPLE_NEURON_ADDRESS_1,
  SAMPLE_NEURON_ADDRESS_2,
  SAMPLE_NEURONS_DATA,
} from "../../test/__fixtures__";
import { ICPNeuron } from "../../types";

// Default sync config for tests
const defaultSyncConfig: SyncConfig = {
  paginationConfig: {},
};

describe("account bridgeHelpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks using the centralized mock functions
    const api = getMockedAPI();
    const framework = getMockedFramework();
    const utils = getMockedUtils();
    const neurons = getMockedNeurons();

    api.fetchBalance.mockResolvedValue(new BigNumber(SAMPLE_BALANCE.toString()));
    api.fetchBlockHeight.mockResolvedValue(new BigNumber(SAMPLE_BLOCK_HEIGHT.toString()));
    api.fetchTxns.mockResolvedValue([]);

    framework.encodeAccountId.mockReturnValue(SAMPLE_ACCOUNT_ID);
    framework.decodeAccountId.mockReturnValue({ xpubOrAddress: SAMPLE_PUBLIC_KEY });
    framework.encodeOperationId.mockImplementation(
      (accountId: string, hash: string, type: string) => `${accountId}_${hash}_${type}`,
    );

    utils.normalizeEpochTimestamp.mockImplementation(
      (timestamp: string) => parseInt(timestamp) / 1000000,
    );
    utils.deriveAddressFromPubkey.mockReturnValue(SAMPLE_ICP_ADDRESS);
    utils.hashTransaction.mockReturnValue("mock_transaction_hash");

    neurons.NeuronsData.empty.mockReturnValue({
      fullNeurons: [],
    });
  });

  describe("getAccountShape", () => {
    it("should create account shape with new account", async () => {
      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.id).toBe(SAMPLE_ACCOUNT_ID);
      expect(result.balance).toEqual(new BigNumber(SAMPLE_BALANCE.toString()));
      expect(result.spendableBalance).toEqual(new BigNumber(SAMPLE_BALANCE.toString()));
      expect(result.blockHeight).toBe(Number(SAMPLE_BLOCK_HEIGHT));
      expect(result.xpub).toBe(SAMPLE_PUBLIC_KEY);
      expect(result.operations).toEqual([]);
      expect(result.operationsCount).toBe(0);
    });

    it("should create account shape with existing account", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue(SAMPLE_TRANSACTIONS);

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: SAMPLE_NEURONS_DATA,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.id).toBe(SAMPLE_ACCOUNT_ID);
      expect(result.balance).toEqual(new BigNumber(SAMPLE_BALANCE.toString()));
      expect(result.operationsCount).toBe(
        (SAMPLE_INITIAL_ACCOUNT.operations?.length || 0) + SAMPLE_TRANSACTIONS.length,
      );
      expect(result.neurons).toBe(SAMPLE_INITIAL_ACCOUNT.neurons);
    });

    it("should handle transactions with staking operations", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([
        SAMPLE_NEURON_STAKING_TRANSACTION,
        SAMPLE_NEURON_TOPUP_TRANSACTION,
      ]);

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: {
            ...SAMPLE_NEURONS_DATA,
            fullNeurons: [
              { accountIdentifier: SAMPLE_NEURON_ADDRESS_1 },
              { accountIdentifier: SAMPLE_NEURON_ADDRESS_2 },
            ] as ICPNeuron[],
          } as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);
    });

    it("should throw error when publicKey is missing", async () => {
      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        rest: {},
      };

      await expect(getAccountShape(accountShapeInfo, defaultSyncConfig)).rejects.toThrow(
        "publicKey wasn't properly restored",
      );
    });

    it("should throw error when derived address is invalid", async () => {
      const utils = getMockedUtils();
      utils.deriveAddressFromPubkey.mockReturnValue("");

      await expect(getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig)).rejects.toThrow(
        "address is required",
      );
    });

    it("should reconciliate publicKey from initialAccount when not provided in rest", async () => {
      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        rest: {},
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: SAMPLE_NEURONS_DATA as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.xpub).toBe(SAMPLE_PUBLIC_KEY);
    });

    it("should handle empty neurons data when no initial account", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([]);
      const mockEmptyNeurons = { fullNeurons: [] };
      getMockedNeurons().NeuronsData.empty.mockReturnValue(mockEmptyNeurons);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.neurons).toEqual(mockEmptyNeurons);
    });
  });

  describe("mapTxToOps internal function behavior", () => {
    it("should handle outgoing transfers correctly", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([SAMPLE_TRANSACTIONS[0]]); // Outgoing transaction

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);

      // Verify that encodeOperationId was called with OUT type
      const framework = getMockedFramework();
      expect(framework.encodeOperationId).toHaveBeenCalledWith(
        expect.any(String),
        "mock_transaction_hash",
        "OUT",
      );
    });

    it("should handle incoming transfers correctly", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([SAMPLE_TRANSACTIONS[1]]); // Incoming transaction

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);

      // Verify that encodeOperationId was called with IN type
      const framework = getMockedFramework();
      expect(framework.encodeOperationId).toHaveBeenCalledWith(
        expect.any(String),
        "mock_transaction_hash",
        "IN",
      );
    });

    it("should handle neuron staking transactions", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([SAMPLE_NEURON_STAKING_TRANSACTION]);

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: {
            ...SAMPLE_NEURONS_DATA,
            fullNeurons: [{ accountIdentifier: SAMPLE_NEURON_ADDRESS_1 }],
          } as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);

      // Verify that encodeOperationId was called with STAKE_NEURON type
      const framework = getMockedFramework();
      expect(framework.encodeOperationId).toHaveBeenCalledWith(
        expect.any(String),
        "mock_transaction_hash",
        "STAKE_NEURON",
      );
    });

    it("should handle neuron top-up transactions", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([SAMPLE_NEURON_TOPUP_TRANSACTION]);

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: {
            ...SAMPLE_NEURONS_DATA,
            fullNeurons: [{ accountIdentifier: SAMPLE_NEURON_ADDRESS_2 }],
          } as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);

      // Verify that encodeOperationId was called with TOP_UP_NEURON type
      const framework = getMockedFramework();
      expect(framework.encodeOperationId).toHaveBeenCalledWith(
        expect.any(String),
        "mock_transaction_hash",
        "TOP_UP_NEURON",
      );
    });

    it("should filter out non-Transfer operations", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([SAMPLE_NON_TRANSFER_TRANSACTION]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toEqual([]);
    });

    it("should handle mixed transaction types", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([
        SAMPLE_TRANSACTIONS[0], // OUT
        SAMPLE_TRANSACTIONS[1], // IN
        SAMPLE_NEURON_STAKING_TRANSACTION, // STAKE_NEURON
        SAMPLE_NEURON_TOPUP_TRANSACTION, // TOP_UP_NEURON
        SAMPLE_NON_TRANSFER_TRANSACTION, // Should be filtered out
      ]);

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: {
            ...SAMPLE_NEURONS_DATA,
            fullNeurons: [
              { accountIdentifier: SAMPLE_NEURON_ADDRESS_1 },
              { accountIdentifier: SAMPLE_NEURON_ADDRESS_2 },
            ] as ICPNeuron[],
          } as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);

      // Should have operations for all Transfer transactions but not the Mint transaction
      const framework = getMockedFramework();
      const calls = framework.encodeOperationId.mock.calls;
      const operationTypes = calls.map((call: unknown[]) => call[2]);

      expect(operationTypes).toContain("OUT");
      expect(operationTypes).toContain("IN");
      expect(operationTypes).toContain("STAKE_NEURON");
      expect(operationTypes).toContain("TOP_UP_NEURON");
    });

    it("should handle transactions with timestamp correctly", async () => {
      const api = getMockedAPI();
      const utils = getMockedUtils();

      utils.normalizeEpochTimestamp.mockReturnValue(1640995200000); // Jan 1, 2022
      api.fetchTxns.mockResolvedValue([SAMPLE_TRANSACTIONS[0]]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(utils.normalizeEpochTimestamp).toHaveBeenCalled();
      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);
    });

    it("should handle transactions without timestamp (fallback to Date.now)", async () => {
      const api = getMockedAPI();

      const transactionWithoutTimestamp = {
        ...SAMPLE_TRANSACTIONS[0],
        transaction: {
          ...SAMPLE_TRANSACTIONS[0].transaction,
          timestamp: [], // Empty timestamp array
        },
      };

      api.fetchTxns.mockResolvedValue([transactionWithoutTimestamp]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);
    });

    it("should handle both sending and receiving operations for the same transaction", async () => {
      const api = getMockedAPI();

      // Create a transaction where our address is both sender and receiver (edge case)
      const selfTransaction = {
        ...SAMPLE_TRANSACTIONS[0],
        transaction: {
          ...SAMPLE_TRANSACTIONS[0].transaction,
          operation: {
            Transfer: {
              to: SAMPLE_ICP_ADDRESS, // Same as our address
              fee: { e8s: BigInt("10000") },
              from: SAMPLE_ICP_ADDRESS, // Same as our address
              amount: { e8s: BigInt("100000000") },
              spender: [],
            },
          },
        },
      };

      api.fetchTxns.mockResolvedValue([selfTransaction]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      // Should create both IN and OUT operations for self-transactions
      expect(result.operations!.length).toBeGreaterThan(0);
    });
  });

  describe("reconciliatePublicKey function behavior", () => {
    it("should throw error when no publicKey and no initialAccount", async () => {
      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        rest: {},
        // No initialAccount provided
      };

      await expect(getAccountShape(accountShapeInfo, defaultSyncConfig)).rejects.toThrow(
        "publicKey wasn't properly restored",
      );
    });

    it("should prefer publicKey from rest over initialAccount", async () => {
      const framework = getMockedFramework();
      framework.decodeAccountId.mockReturnValue({ xpubOrAddress: "initial_account_pubkey" });

      const accountShapeInfo = {
        ...SAMPLE_ACCOUNT_SHAPE_INFO,
        rest: {
          publicKey: "preferred_pubkey",
        },
        initialAccount: {
          ...SAMPLE_INITIAL_ACCOUNT,
          type: "Account" as const,
          neurons: SAMPLE_NEURONS_DATA as any,
        },
      };

      const result = await getAccountShape(accountShapeInfo, defaultSyncConfig);

      expect(result.xpub).toBe("preferred_pubkey");
      expect(framework.decodeAccountId).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const api = getMockedAPI();
      api.fetchBalance.mockRejectedValue(new Error("API Error"));

      await expect(getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig)).rejects.toThrow(
        "API Error",
      );
    });

    it("should handle fetchBlockHeight errors", async () => {
      const api = getMockedAPI();
      api.fetchBlockHeight.mockRejectedValue(new Error("Block height fetch failed"));

      await expect(getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig)).rejects.toThrow(
        "Block height fetch failed",
      );
    });

    it("should handle fetchTxns errors", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockRejectedValue(new Error("Transactions fetch failed"));

      await expect(getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig)).rejects.toThrow(
        "Transactions fetch failed",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty transaction list", async () => {
      const api = getMockedAPI();
      api.fetchTxns.mockResolvedValue([]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toEqual([]);
      expect(result.operationsCount).toBe(0);
    });

    it("should handle transactions with missing operation field", async () => {
      const api = getMockedAPI();

      const malformedTransaction = {
        id: BigInt("9999"),
        transaction: {
          memo: BigInt("12345"),
          // Missing operation field
        },
      };

      api.fetchTxns.mockResolvedValue([malformedTransaction]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toEqual([]);
    });

    it("should handle very large amounts", async () => {
      const api = getMockedAPI();

      const largeAmountTransaction = {
        ...SAMPLE_TRANSACTIONS[0],
        transaction: {
          ...SAMPLE_TRANSACTIONS[0].transaction,
          operation: {
            Transfer: {
              ...SAMPLE_TRANSACTIONS[0].transaction.operation.Transfer,
              amount: { e8s: BigInt("999999999999999999") }, // Very large amount
            },
          },
        },
      };

      api.fetchTxns.mockResolvedValue([largeAmountTransaction]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);
    });

    it("should handle zero-value transactions", async () => {
      const api = getMockedAPI();

      const zeroValueTransaction = {
        ...SAMPLE_TRANSACTIONS[0],
        transaction: {
          ...SAMPLE_TRANSACTIONS[0].transaction,
          operation: {
            Transfer: {
              ...SAMPLE_TRANSACTIONS[0].transaction.operation.Transfer,
              amount: { e8s: BigInt("0") }, // Zero amount
            },
          },
        },
      };

      api.fetchTxns.mockResolvedValue([zeroValueTransaction]);

      const result = await getAccountShape(SAMPLE_ACCOUNT_SHAPE_INFO, defaultSyncConfig);

      expect(result.operations).toBeDefined();
      expect(result.operations!.length).toBeGreaterThan(0);
    });
  });
});
