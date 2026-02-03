import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import { rpcClient } from "./rpc";

const mockClient = {
  close: jest.fn(),
  setMaxNodesPerTransaction: jest.fn().mockReturnThis(),
  setNetwork: jest.fn().mockReturnThis(),
} as unknown as Client;

jest.mock("@hashgraph/sdk", () => {
  return {
    Transaction: jest.fn(),
    Client: {
      forMainnetAsync: jest.fn(async () => mockClient),
    },
  };
});

describe("getInstance", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await rpcClient._resetInstance();
  });

  it("returns cached client instance for multiple calls", async () => {
    const client1 = await rpcClient.getInstance();
    const client2 = await rpcClient.getInstance();

    expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
    expect(client1).toBe(mockClient);
    expect(client2).toBe(client1);
  });

  it("handles concurrent calls without creating multiple clients", async () => {
    const promises = [...Array(10)].map(() => rpcClient.getInstance());
    const clients = await Promise.all(promises);

    expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
    expect(clients.every(c => c === clients[0])).toBe(true);
  });
});

describe("broadcastTransaction", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await rpcClient._resetInstance();
  });

  it("executes the transaction using the client", async () => {
    const expectedResponse = { transactionId: "test-tx-id" } as unknown as TransactionResponse;
    const mockedExecute = jest.fn().mockResolvedValue(expectedResponse);
    const mockTransaction = { execute: mockedExecute } as unknown as Transaction;

    const response = await rpcClient.broadcastTransaction(mockTransaction);

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute).toHaveBeenCalledWith(mockClient);
    expect(response).toBe(expectedResponse);
  });

  it("reuses the same client instance for multiple calls", async () => {
    const mockedExecute1 = jest.fn();
    const mockedExecute2 = jest.fn();

    const mockTransaction1 = { execute: mockedExecute1 } as unknown as Transaction;
    const mockTransaction2 = { execute: mockedExecute2 } as unknown as Transaction;

    await rpcClient.broadcastTransaction(mockTransaction1);
    await rpcClient.broadcastTransaction(mockTransaction2);

    expect(Client.forMainnetAsync).toHaveBeenCalledTimes(1);
    expect(mockedExecute1).toHaveBeenCalledTimes(1);
    expect(mockedExecute2).toHaveBeenCalledTimes(1);
    expect(mockedExecute1).toHaveBeenCalledWith(mockClient);
    expect(mockedExecute2).toHaveBeenCalledWith(mockClient);
  });
});
