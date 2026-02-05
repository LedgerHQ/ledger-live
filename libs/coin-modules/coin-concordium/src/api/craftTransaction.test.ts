import type { ConcordiumCoinConfig } from "../types";
import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../logic", () => ({
  craftTransaction: jest.fn(),
  getNextValidSequence: jest.fn(),
}));

const { craftTransaction: craftTransactionMock, getNextValidSequence: getNextValidSequenceMock } =
  jest.requireMock("../logic");

const mockConfig: ConcordiumCoinConfig = {
  networkType: "testnet",
  grpcUrl: "https://grpc.testnet.concordium.com",
  grpcPort: 20000,
  proxyUrl: "https://wallet-proxy.testnet.concordium.com",
  minReserve: 0,
};

describe("api/craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should craft transaction with memo", async () => {
    const api = createApi(mockConfig);
    getNextValidSequenceMock.mockResolvedValue(BigInt(5));
    craftTransactionMock.mockResolvedValue({
      type: 22, // TransferWithMemo
      header: {
        sender: { address: VALID_ADDRESS, toBuffer: () => Buffer.alloc(32) },
        nonce: BigInt(5),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        energyAmount: BigInt(0),
      },
      payload: {
        toAddress: { address: VALID_ADDRESS_2, toBuffer: () => Buffer.alloc(32) },
        amount: BigInt(1000000),
        memo: Buffer.from("test memo"),
      },
    });
    const transactionIntent = {
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(1000000),
      memo: { type: "string" as const, value: "test memo" },
    };

    const result = await api.craftTransaction(transactionIntent);

    expect(getNextValidSequenceMock).toHaveBeenCalledWith(
      transactionIntent.sender,
      expect.objectContaining({ id: "concordium" }),
    );
    expect(craftTransactionMock).toHaveBeenCalledWith(
      { address: transactionIntent.sender, nextSequenceNumber: BigInt(5) },
      expect.objectContaining({
        recipient: transactionIntent.recipient,
        memo: "test memo",
      }),
    );
    expect(result).toHaveProperty("transaction");
    expect(typeof result.transaction).toBe("string");
  });

  it("should craft transaction without memo", async () => {
    const api = createApi(mockConfig);
    getNextValidSequenceMock.mockResolvedValue(BigInt(10));
    craftTransactionMock.mockResolvedValue({
      type: 3, // Transfer
      header: {
        sender: { address: VALID_ADDRESS, toBuffer: () => Buffer.alloc(32) },
        nonce: BigInt(10),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        energyAmount: BigInt(0),
      },
      payload: {
        toAddress: { address: VALID_ADDRESS_2, toBuffer: () => Buffer.alloc(32) },
        amount: BigInt(500000),
      },
    });
    const transactionIntent = {
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(500000),
    };

    const result = await api.craftTransaction(transactionIntent);

    expect(craftTransactionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ memo: expect.anything() }),
    );
    expect(result).toHaveProperty("transaction");
    expect(typeof result.transaction).toBe("string");
  });
});
