import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import coinConfig from "../config";
import { rpcClient } from "./rpc";
import { mockCoinConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";

const mockCurrency = getMockedCurrency();

const mockClient = {
  close: jest.fn(),
  setMaxNodesPerTransaction: jest.fn().mockReturnThis(),
  setNetwork: jest.fn().mockReturnThis(),
} as unknown as Client;

jest.mock("@hashgraph/sdk", () => {
  return {
    Transaction: jest.fn(),
    Client: {
      forMainnet: jest.fn(() => mockClient),
    },
  };
});

describe("rpcClient", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(mockCoinConfig);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    rpcClient._resetInstance();
  });

  describe("getInstance", () => {
    it("returns cached client instance for multiple calls", () => {
      const client1 = rpcClient.getInstance(mockCurrency);
      const client2 = rpcClient.getInstance(mockCurrency);

      expect(Client.forMainnet).toHaveBeenCalledTimes(1);
      expect(client1).toBe(mockClient);
      expect(client2).toBe(client1);
    });
  });

  describe("broadcastTransaction", () => {
    it("executes the transaction using the client", async () => {
      const expectedResponse = { transactionId: "test-tx-id" } as unknown as TransactionResponse;
      const mockedExecute = jest.fn().mockResolvedValue(expectedResponse);
      const mockTransaction = { execute: mockedExecute } as unknown as Transaction;

      const response = await rpcClient.broadcastTransaction({
        currency: mockCurrency,
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
        currency: mockCurrency,
        transaction: mockTransaction1,
      });
      await rpcClient.broadcastTransaction({
        currency: mockCurrency,
        transaction: mockTransaction2,
      });

      expect(Client.forMainnet).toHaveBeenCalledTimes(1);
      expect(mockedExecute1).toHaveBeenCalledTimes(1);
      expect(mockedExecute2).toHaveBeenCalledTimes(1);
      expect(mockedExecute1).toHaveBeenCalledWith(mockClient);
      expect(mockedExecute2).toHaveBeenCalledWith(mockClient);
    });
  });
});
