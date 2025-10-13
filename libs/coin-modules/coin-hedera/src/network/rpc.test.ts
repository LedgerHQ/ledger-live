import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import { rpcClient } from "./rpc";

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
      forMainnet: jest.fn(() => getMockClient("mainnet")),
    },
  };
});

describe("getClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcClient._resetClient();
  });

  it("reuses the same client instance for multiple calls", async () => {
    const mockTransaction1 = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id-1" }),
    } as unknown as Transaction;
    const mockTransaction2 = {
      execute: jest.fn().mockResolvedValue({ transactionId: "test-id-2" }),
    } as unknown as Transaction;

    await rpcClient.broadcastTransaction(mockTransaction1);
    await rpcClient.broadcastTransaction(mockTransaction2);

    expect(Client.forMainnet).toHaveBeenCalledTimes(1);
  });
});

describe("broadcastTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcClient._resetClient();
  });

  it("executes the transaction using the client", async () => {
    const expectedResponse = { transactionId: "test-tx-id" } as unknown as TransactionResponse;
    const mockTransaction = {
      execute: jest.fn().mockResolvedValue(expectedResponse),
    } as unknown as Transaction;

    const response = await rpcClient.broadcastTransaction(mockTransaction);

    expect(mockTransaction.execute).toHaveBeenCalled();
    expect(response).toEqual(expectedResponse);
  });
});
