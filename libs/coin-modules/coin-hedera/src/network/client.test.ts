import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import coinConfig, { type HederaCoinConfig } from "../config";
import { hederaClient } from "./client";

jest.mock("@hashgraph/sdk", () => {
  const mockClients: Record<string, Client> = {};

  const getMockClient = (key: string) => {
    if (!mockClients[key]) {
      const client = {
        setMaxNodesPerTransaction: jest.fn(() => mockClients[key]),
        setNetwork: jest.fn(() => mockClients[key]),
      } as unknown as Client;
      mockClients[key] = client;
    }

    return mockClients[key];
  };

  return {
    Transaction: jest.fn(),
    Client: {
      forTestnet: jest.fn(() => getMockClient("testnet")),
      forMainnet: jest.fn(() => getMockClient("mainnet")),
    },
  };
});

jest.mock("../config", () => {
  let config: HederaCoinConfig = { network: "testnet", status: { type: "active" } };

  return {
    setCoinConfig: jest.fn((newConfig: () => HederaCoinConfig) => {
      config = newConfig();
    }),
    getCoinConfig: jest.fn(() => {
      return config;
    }),
  };
});

describe("getClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hederaClient._resetClient();
  });

  it("creates a testnet client when network is testnet", async () => {
    const mockCoinConfig: HederaCoinConfig = { network: "testnet", status: { type: "active" } };
    coinConfig.setCoinConfig(() => mockCoinConfig);

    const mockTransaction = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id" }),
    } as unknown as Transaction;

    await hederaClient.broadcastTransaction(mockTransaction);

    expect(Client.forTestnet).toHaveBeenCalled();
    expect(Client.forMainnet).not.toHaveBeenCalled();
  });

  it("creates a mainnet client when network is mainnet", async () => {
    const mockCoinConfig: HederaCoinConfig = { network: "mainnet", status: { type: "active" } };
    coinConfig.setCoinConfig(() => mockCoinConfig);

    const mockTransaction = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id" }),
    } as unknown as Transaction;

    await hederaClient.broadcastTransaction(mockTransaction);

    expect(Client.forMainnet).toHaveBeenCalled();
    expect(Client.forTestnet).not.toHaveBeenCalled();
  });

  it("reuses the same client instance for multiple calls", async () => {
    const mockCoinConfig: HederaCoinConfig = { network: "testnet", status: { type: "active" } };
    coinConfig.setCoinConfig(() => mockCoinConfig);

    const mockTransaction1 = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id-1" }),
    } as unknown as Transaction;
    const mockTransaction2 = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id-2" }),
    } as unknown as Transaction;

    await hederaClient.broadcastTransaction(mockTransaction1);
    await hederaClient.broadcastTransaction(mockTransaction2);

    expect(Client.forTestnet).toHaveBeenCalledTimes(1);
  });
});

describe("broadcastTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hederaClient._resetClient();
  });

  it("executes the transaction using the client", async () => {
    const expectedResponse = { transactionId: "test-tx-id" } as unknown as TransactionResponse;
    const mockTransaction = {
      execute: jest.fn().mockResolvedValue(expectedResponse),
    } as unknown as Transaction;

    const response = await hederaClient.broadcastTransaction(mockTransaction);

    expect(mockTransaction.execute).toHaveBeenCalled();
    expect(response).toEqual(expectedResponse);
  });
});
