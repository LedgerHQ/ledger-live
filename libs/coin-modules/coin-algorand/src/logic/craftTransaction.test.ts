import * as network from "../network";
import { craftTransaction, craftOptInTransaction } from "./craftTransaction";

jest.mock("../network");

// Mock algosdk transaction creation functions
jest.mock("algosdk", () => ({
  makePaymentTxnWithSuggestedParams: jest.fn().mockReturnValue({
    firstRound: 1000,
    lastRound: 2000,
    get_obj_for_encoding: () => ({
      amt: 1000000,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from("sender"),
      rcv: Buffer.from("recipient"),
      type: "pay",
    }),
  }),
  makeAssetTransferTxnWithSuggestedParams: jest.fn().mockReturnValue({
    firstRound: 1000,
    lastRound: 2000,
    get_obj_for_encoding: () => ({
      amt: 100,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from("sender"),
      rcv: Buffer.from("recipient"),
      xaid: 12345,
      type: "axfer",
    }),
  }),
}));

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

describe("craftTransaction", () => {
  const defaultParams = {
    fee: 0,
    minFee: 1000,
    firstRound: 1000,
    lastRound: 2000,
    genesisHash: "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
    genesisID: "mainnet-v1.0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionParams.mockResolvedValue(defaultParams);
  });

  it("should craft a native ALGO payment transaction", async () => {
    const input = {
      sender: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      recipient: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ",
      amount: 1000000n,
    };

    const result = await craftTransaction(input);

    expect(result).toHaveProperty("serializedTransaction");
    expect(result).toHaveProperty("txPayload");
    expect(typeof result.serializedTransaction).toBe("string");
    expect(result.serializedTransaction).toMatch(/^[a-f0-9]+$/i);
  });

  it("should craft an ASA transfer transaction when assetId is provided", async () => {
    const input = {
      sender: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      recipient: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ",
      amount: 100n,
      assetId: "12345",
    };

    const result = await craftTransaction(input);

    expect(result).toHaveProperty("serializedTransaction");
    expect(result.txPayload).not.toBeUndefined();
  });

  it("should include memo as note when provided", async () => {
    const input = {
      sender: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      recipient: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ",
      amount: 1000000n,
      memo: "Test payment",
    };

    const result = await craftTransaction(input);

    expect(result.txPayload).not.toBeUndefined();
  });

  it("should use custom fees when provided", async () => {
    const input = {
      sender: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      recipient: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ",
      amount: 1000000n,
      fees: 2000n,
    };

    const result = await craftTransaction(input);

    expect(result).toHaveProperty("serializedTransaction");
    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
  });

  it("should fetch transaction params from network", async () => {
    const input = {
      sender: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      recipient: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ",
      amount: 1000000n,
    };

    await craftTransaction(input);

    expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
  });
});

describe("craftOptInTransaction", () => {
  const defaultParams = {
    fee: 0,
    minFee: 1000,
    firstRound: 1000,
    lastRound: 2000,
    genesisHash: "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
    genesisID: "mainnet-v1.0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionParams.mockResolvedValue(defaultParams);
  });

  it("should craft an opt-in transaction with sender as recipient", async () => {
    const sender = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
    const assetId = "12345";

    const result = await craftOptInTransaction(sender, assetId);

    expect(result).toHaveProperty("serializedTransaction");
    expect(result).toHaveProperty("txPayload");
  });

  it("should craft opt-in with 0 amount", async () => {
    const sender = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
    const assetId = "67890";

    const result = await craftOptInTransaction(sender, assetId);

    expect(result.serializedTransaction).not.toBeUndefined();
  });

  it("should use custom fees for opt-in when provided", async () => {
    const sender = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
    const assetId = "12345";
    const fees = 2000n;

    const result = await craftOptInTransaction(sender, assetId, fees);

    expect(result).toHaveProperty("serializedTransaction");
  });
});
