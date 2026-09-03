import {
  createFixtureConfig,
  createFixtureContext,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
} from "../test/fixtures";
import { createApi } from ".";

const context = createFixtureContext();
const config = createFixtureConfig();

jest.mock("../logic", () => ({
  craftTransaction: jest.fn(),
  getNextValidSequence: jest.fn(),
}));

const { craftTransaction: craftTransactionMock, getNextValidSequence: getNextValidSequenceMock } =
  jest.requireMock("../logic");

describe("api/craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should craft transaction with memo", async () => {
    const api = createApi("concordium_testnet");
    getNextValidSequenceMock.mockResolvedValue(5);
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
      intentType: "transaction" as const,
      type: "send",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(1000000),
      asset: { type: "native", ticker: "CCD", id: "ccd" },
      memo: { type: "string" as const, value: "test memo" },
    } as any;

    const result = await api.craftTransaction(context, transactionIntent);

    expect(getNextValidSequenceMock).toHaveBeenCalledWith(
      config,
      transactionIntent.sender,
      "concordium_testnet",
    );
    expect(craftTransactionMock).toHaveBeenCalledWith(
      { address: transactionIntent.sender, nextSequenceNumber: 5 },
      expect.objectContaining({
        recipient: transactionIntent.recipient,
        memo: "test memo",
      }),
    );
    expect(result).toHaveProperty("transaction");
    expect(typeof result.transaction).toBe("string");
  });

  it("should craft transaction without memo", async () => {
    const api = createApi("concordium_testnet");
    getNextValidSequenceMock.mockResolvedValue(10);
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
      intentType: "transaction" as const,
      type: "send",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(500000),
      asset: { type: "native", ticker: "CCD", id: "ccd" },
    } as any;

    const result = await api.craftTransaction(context, transactionIntent);

    expect(craftTransactionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ memo: expect.anything() }),
    );
    expect(result).toHaveProperty("transaction");
    expect(typeof result.transaction).toBe("string");
  });

  it("should reject a non-native asset instead of crafting a CCD transfer", async () => {
    const api = createApi("concordium_testnet");
    const transactionIntent = {
      intentType: "transaction" as const,
      type: "send",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(1000000),
      asset: { type: "plt", assetReference: "t-USDT" },
    } as any;

    await expect(api.craftTransaction(context, transactionIntent)).rejects.toThrow(
      /asset type plt is not supported/,
    );
    // Crafting ignores `asset`, so without the guard this would sign a CCD
    // transfer of the same integer amount. PLT crafting is LIVE-28337.
    expect(getNextValidSequenceMock).not.toHaveBeenCalled();
    expect(craftTransactionMock).not.toHaveBeenCalled();
  });
});
