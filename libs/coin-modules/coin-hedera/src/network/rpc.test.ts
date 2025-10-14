import { Client, Transaction, TransactionResponse } from "@hashgraph/sdk";
import { rpcClient } from "./rpc";

const mockClient = {
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

describe("getInstance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcClient._resetInstance();
  });

  it("returns cached client instance for multiple calls", () => {
    const client1 = rpcClient.getInstance();
    const client2 = rpcClient.getInstance();

    expect(Client.forMainnet).toHaveBeenCalledTimes(1);
    expect(client1).toBe(mockClient);
    expect(client2).toBe(client1);
  });
});

describe("broadcastTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpcClient._resetInstance();
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

    expect(Client.forMainnet).toHaveBeenCalledTimes(1);
    expect(mockedExecute1).toHaveBeenCalledTimes(1);
    expect(mockedExecute2).toHaveBeenCalledTimes(1);
    expect(mockedExecute1).toHaveBeenCalledWith(mockClient);
    expect(mockedExecute2).toHaveBeenCalledWith(mockClient);
  });
});
