import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import coinConfig from "../config";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { rpcClient } from "./rpc";

const mockCurrency = getMockedCurrency();

const createMockClient = (): Client =>
  ({
    close: jest.fn(),
    setMaxAttempts: jest.fn(),
    setMaxBackoff: jest.fn(),
    setMaxNodesPerTransaction: jest.fn(),
    setMinBackoff: jest.fn(),
    setNetwork: jest.fn(),
    setRequestTimeout: jest.fn(),
    updateNetwork: jest.fn(),
  }) as unknown as Client;

const mockClient = createMockClient();
const mockTestnetClient = createMockClient();

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

    it("applies sdkClient options from config", async () => {
      const configWithSdkOptions = {
        ...mockConfig,
        sdkClientOptions: {
          maxAttempts: 0,
          requestTimeout: 5_000,
          minBackoff: 100,
          maxBackoff: 500,
        },
      };

      await rpcClient.getInstance(configWithSdkOptions);

      expect(mockClient.setMaxNodesPerTransaction).toHaveBeenCalledWith(1);
      expect(mockClient.setMaxAttempts).toHaveBeenCalledWith(0);
      expect(mockClient.setRequestTimeout).toHaveBeenCalledWith(5_000);
      expect(mockClient.setMinBackoff).toHaveBeenCalledWith(100);
      expect(mockClient.setMaxBackoff).toHaveBeenCalledWith(500);
    });

    it("does not apply sdk retry options when sdkClientOptions is omitted", async () => {
      await rpcClient.getInstance(mockConfig);

      expect(mockClient.setMaxNodesPerTransaction).toHaveBeenCalledWith(1);
      expect(mockClient.setMaxAttempts).not.toHaveBeenCalled();
      expect(mockClient.setRequestTimeout).not.toHaveBeenCalled();
      expect(mockClient.setMinBackoff).not.toHaveBeenCalled();
      expect(mockClient.setMaxBackoff).not.toHaveBeenCalled();
    });

    it("creates separate cached clients for different sdkClientOptions settings on the same network", async () => {
      const defaultSdkClient = createMockClient();
      jest
        .mocked(Client.forMainnetAsync)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(defaultSdkClient);

      const noRetryConfig = { ...mockConfig, sdkClientOptions: { maxAttempts: 0 } };
      const defaultRetryConfig = { ...mockConfig };

      const noRetryClient = await rpcClient.getInstance(noRetryConfig);
      const defaultRetryClient = await rpcClient.getInstance(defaultRetryConfig);

      expect(Client.forMainnetAsync).toHaveBeenCalledTimes(2);
      expect(noRetryClient).toBe(mockClient);
      expect(defaultRetryClient).toBe(defaultSdkClient);
      expect(mockClient.setMaxAttempts).toHaveBeenCalledWith(0);
      expect(defaultSdkClient.setMaxAttempts).not.toHaveBeenCalled();
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
