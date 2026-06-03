import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import coinConfig from "../config";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { rpcClient } from "./rpc";

const mockCurrency = getMockedCurrency();

const mockClient = {
  close: jest.fn(),
  setMaxNodesPerTransaction: jest.fn().mockReturnThis(),
  setNetwork: jest.fn().mockReturnThis(),
  updateNetwork: jest.fn(),
} as unknown as Client;

const mockTestnetClient = {
  close: jest.fn(),
  setMaxNodesPerTransaction: jest.fn().mockReturnThis(),
  setNetwork: jest.fn().mockReturnThis(),
  updateNetwork: jest.fn(),
} as unknown as Client;

jest.mock("@hashgraph/sdk", () => {
  return {
    Transaction: jest.fn(),
    Client: {
      forMainnetAsync: jest.fn(() => Promise.resolve(mockClient)),
      forTestnetAsync: jest.fn(() => Promise.resolve(mockTestnetClient)),
    },
  };
});

describe("rpcClient", () => {
  const mockConfig = getMockedConfig();

  beforeAll(() => {
    coinConfig.setCoinConfig(() => mockConfig);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await rpcClient._resetInstance();
  });

  describe("getInstance", () => {
    it("returns cached client instance for multiple calls", async () => {
      const client1 = await rpcClient.getInstance(mockCurrency.id);
      const client2 = await rpcClient.getInstance(mockCurrency.id);

      expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
      expect(client1).toBe(mockClient);
      expect(client2).toBe(client1);
    });

    it("handles concurrent calls without creating multiple clients", async () => {
      const promises = [...Array(10)].map(() => rpcClient.getInstance(mockCurrency.id));
      const clients = await Promise.all(promises);

      expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
      expect(clients.every(c => c === clients[0])).toBe(true);
    });

    it("creates separate cached clients for mainnet and testnet", async () => {
      const testnetConfig = { ...mockConfig, networkType: "testnet" as const };

      const mainnetClient = await rpcClient.getInstance(mockConfig);
      const testnetClient = await rpcClient.getInstance(testnetConfig);
      // second call to each - must still be cached
      const mainnetClient2 = await rpcClient.getInstance(mockConfig);
      const testnetClient2 = await rpcClient.getInstance(testnetConfig);

      expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
      expect(Client.forTestnetAsync).toHaveBeenCalledTimes(1);
      expect(mainnetClient).toBe(mockClient);
      expect(testnetClient).toBe(mockTestnetClient);
      expect(mainnetClient2).toBe(mainnetClient);
      expect(testnetClient2).toBe(testnetClient);
    });
  });

  describe("broadcastTransaction", () => {
    it("executes the transaction using the client", async () => {
      const expectedResponse = { transactionId: "test-tx-id" } as unknown as TransactionResponse;
      const mockedExecute = jest.fn().mockResolvedValue(expectedResponse);
      const mockTransaction = { execute: mockedExecute } as unknown as Transaction;

      const response = await rpcClient.broadcastTransaction({
        configOrCurrencyId: mockCurrency.id,
        transaction: mockTransaction,
      });

      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(mockClient);
      expect(response).toBe(expectedResponse);
    });

    it("reuses the same client instance for multiple calls", async () => {
      const mockedExecute1 = jest.fn();
      const mockedExecute2 = jest.fn();

      const mockTransaction1 = { execute: mockedExecute1 } as unknown as Transaction;
      const mockTransaction2 = { execute: mockedExecute2 } as unknown as Transaction;

      await rpcClient.broadcastTransaction({
        configOrCurrencyId: mockCurrency.id,
        transaction: mockTransaction1,
      });
      await rpcClient.broadcastTransaction({
        configOrCurrencyId: mockCurrency.id,
        transaction: mockTransaction2,
      });

      expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
      expect(mockedExecute1).toHaveBeenCalledTimes(1);
      expect(mockedExecute2).toHaveBeenCalledTimes(1);
      expect(mockedExecute1).toHaveBeenCalledWith(mockClient);
      expect(mockedExecute2).toHaveBeenCalledWith(mockClient);
    });
  });
});
