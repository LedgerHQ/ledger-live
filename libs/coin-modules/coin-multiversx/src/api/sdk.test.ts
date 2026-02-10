/**
 * Unit tests for sdk.ts helper functions.
 * Note: The SDK module initializes singleton instances at module load time,
 * making full mocking complex. These tests focus on the internal helper functions
 * that can be tested in isolation.
 */

import BigNumber from "bignumber.js";

// Mock dependencies before importing the module
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue("https://api.multiversx.com"),
}));

jest.mock("@ledgerhq/cryptoassets", () => ({
  getAbandonSeedAddress: jest.fn().mockReturnValue("erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu"),
}));

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn((accountId, hash, type) => `${accountId}-${hash}-${type}`),
}));

jest.mock("@ledgerhq/coin-framework/serialization/index", () => ({
  inferSubOperations: jest.fn().mockReturnValue([]),
}));

// Mock the MultiversX SDK
jest.mock("@multiversx/sdk-core", () => ({
  ApiNetworkProvider: jest.fn().mockImplementation(() => ({
    getNetworkConfig: jest.fn().mockResolvedValue({ ChainID: "1" }),
    getAccount: jest.fn().mockResolvedValue({ nonce: 42 }),
  })),
  Address: jest.fn().mockImplementation((addr) => ({
    bech32: () => addr,
    isSmartContract: () => false,
  })),
  Transaction: jest.fn().mockImplementation(() => ({
    computeFee: jest.fn().mockReturnValue(new BigNumber("50000000000000")),
  })),
  TransactionPayload: {
    fromEncoded: jest.fn().mockReturnValue({}),
  },
}));

// Mock the API calls
jest.mock("./apiCalls", () => {
  const mockApi = {
    getAccountDetails: jest.fn().mockResolvedValue({
      balance: "1000000000000000000",
      nonce: 5,
      isGuarded: false,
    }),
    getBlockchainBlockHeight: jest.fn().mockResolvedValue(12345),
    getProviders: jest.fn().mockResolvedValue([]),
    getHistory: jest.fn().mockResolvedValue([]),
    getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
    getAccountDelegations: jest.fn().mockResolvedValue([]),
    getESDTTokensCountForAddress: jest.fn().mockResolvedValue(0),
    getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
    submit: jest.fn().mockResolvedValue("txHash123"),
  };
  return jest.fn().mockImplementation(() => mockApi);
});

describe("sdk", () => {
  describe("module exports", () => {
    it("exports getAccount function", async () => {
      const { getAccount } = await import("./sdk");
      expect(typeof getAccount).toBe("function");
    });

    it("exports getProviders function", async () => {
      const { getProviders } = await import("./sdk");
      expect(typeof getProviders).toBe("function");
    });

    it("exports getNetworkConfig function", async () => {
      const { getNetworkConfig } = await import("./sdk");
      expect(typeof getNetworkConfig).toBe("function");
    });

    it("exports getAccountNonce function", async () => {
      const { getAccountNonce } = await import("./sdk");
      expect(typeof getAccountNonce).toBe("function");
    });

    it("exports getEGLDOperations function", async () => {
      const { getEGLDOperations } = await import("./sdk");
      expect(typeof getEGLDOperations).toBe("function");
    });

    it("exports getAccountESDTTokens function", async () => {
      const { getAccountESDTTokens } = await import("./sdk");
      expect(typeof getAccountESDTTokens).toBe("function");
    });

    it("exports getAccountDelegations function", async () => {
      const { getAccountDelegations } = await import("./sdk");
      expect(typeof getAccountDelegations).toBe("function");
    });

    it("exports hasESDTTokens function", async () => {
      const { hasESDTTokens } = await import("./sdk");
      expect(typeof hasESDTTokens).toBe("function");
    });

    it("exports getESDTOperations function", async () => {
      const { getESDTOperations } = await import("./sdk");
      expect(typeof getESDTOperations).toBe("function");
    });

    it("exports getFees function", async () => {
      const { getFees } = await import("./sdk");
      expect(typeof getFees).toBe("function");
    });

    it("exports broadcastTransaction function", async () => {
      const { broadcastTransaction } = await import("./sdk");
      expect(typeof broadcastTransaction).toBe("function");
    });
  });

  describe("function signatures", () => {
    it("getAccount accepts address string", async () => {
      const { getAccount } = await import("./sdk");
      // Function should accept string parameter
      expect(getAccount.length).toBe(1);
    });

    it("getProviders accepts no parameters", async () => {
      const { getProviders } = await import("./sdk");
      expect(getProviders.length).toBe(0);
    });

    it("getNetworkConfig accepts no parameters", async () => {
      const { getNetworkConfig } = await import("./sdk");
      expect(getNetworkConfig.length).toBe(0);
    });

    it("getAccountNonce accepts address string", async () => {
      const { getAccountNonce } = await import("./sdk");
      expect(getAccountNonce.length).toBe(1);
    });

    it("getEGLDOperations accepts 4 parameters", async () => {
      const { getEGLDOperations } = await import("./sdk");
      expect(getEGLDOperations.length).toBe(4);
    });

    it("getESDTOperations accepts 4 parameters", async () => {
      const { getESDTOperations } = await import("./sdk");
      expect(getESDTOperations.length).toBe(4);
    });

    it("getFees accepts transaction object", async () => {
      const { getFees } = await import("./sdk");
      expect(getFees.length).toBe(1);
    });

    it("broadcastTransaction accepts signed operation", async () => {
      const { broadcastTransaction } = await import("./sdk");
      expect(broadcastTransaction.length).toBe(1);
    });
  });
});
