import * as v8 from "v8";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import * as network from "../network";
import type { AlgorandMemo } from "../types";
import { craftTransaction, craftOptInTransaction, craftApiTransaction } from "./craftTransaction";

jest.mock("../network");

jest.mock("algosdk", () => ({
  base64ToBytes: jest.fn((s: string) => Buffer.from(s, "base64")),
  encodeMsgpack: jest.fn((obj: unknown) => v8.serialize(obj)),
  makePaymentTxnWithSuggestedParamsFromObject: jest.fn(
    ({
      sender,
      receiver,
      amount,
      note,
    }: {
      sender: string;
      receiver: string;
      amount: number;
      note?: Uint8Array;
      suggestedParams: unknown;
    }) => ({
      amt: amount,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from(sender),
      rcv: Buffer.from(receiver),
      type: "pay",
      ...(note ? { note: Buffer.from(note) } : {}),
    }),
  ),
  makeAssetTransferTxnWithSuggestedParamsFromObject: jest.fn(
    ({
      sender,
      receiver,
      amount,
      assetIndex,
      note,
    }: {
      sender: string;
      receiver: string;
      amount: number;
      assetIndex: number;
      note?: Uint8Array;
      suggestedParams: unknown;
    }) => ({
      amt: amount,
      fee: 1000,
      fv: 1000,
      lv: 2000,
      snd: Buffer.from(sender),
      arcv: Buffer.from(receiver),
      xaid: assetIndex,
      type: "axfer",
      ...(note ? { note: Buffer.from(note) } : {}),
    }),
  ),
}));

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

function decodeTxPayload(serializedTransaction: string) {
  return v8.deserialize(Buffer.from(serializedTransaction, "hex")) as Record<string, unknown>;
}

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

  it("should craft a native ALGO payment with correct amount, fee and type", async () => {
    const input = {
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
    };

    const result = await craftTransaction(input);

    expect(result.serializedTransaction).toMatch(/^[a-f0-9]+$/i);

    const decoded = decodeTxPayload(result.serializedTransaction);
    expect(decoded.type).toBe("pay");
    expect(decoded.amt).toBe(1000000);
    expect(decoded.fee).toBe(1000);
    expect(Buffer.from(decoded.snd as Uint8Array).toString()).toBe("SENDER_ADDR");
    expect(Buffer.from(decoded.rcv as Uint8Array).toString()).toBe("RECIPIENT_ADDR");
  });

  it("should craft an ASA transfer with correct assetId and amount", async () => {
    const input = {
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 100n,
      assetId: "12345",
    };

    const result = await craftTransaction(input);

    const decoded = decodeTxPayload(result.serializedTransaction);
    expect(decoded.type).toBe("axfer");
    expect(decoded.amt).toBe(100);
    expect(decoded.xaid).toBe(12345);
    expect(Buffer.from(decoded.snd as Uint8Array).toString()).toBe("SENDER_ADDR");
    expect(Buffer.from(decoded.arcv as Uint8Array).toString()).toBe("RECIPIENT_ADDR");
  });

  it("should include memo as note in the payload", async () => {
    const input = {
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
      memo: "Test payment",
    };

    const result = await craftTransaction(input);

    const decoded = decodeTxPayload(result.serializedTransaction);
    expect(Buffer.from(decoded.note as Uint8Array).toString()).toBe("Test payment");
  });

  it("should omit note when no memo is provided", async () => {
    const input = {
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
    };

    const result = await craftTransaction(input);

    const decoded = decodeTxPayload(result.serializedTransaction);
    expect(decoded.note).toBeUndefined();
  });

  it("should also expose txPayload with matching attributes", async () => {
    const input = {
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 500000n,
    };

    const result = await craftTransaction(input);

    expect(result.txPayload.amt).toBe(500000);
    expect(result.txPayload.type).toBe("pay");
    expect(result.txPayload.fee).toBe(1000);
  });

  it("should fetch transaction params from network", async () => {
    await craftTransaction({
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
    });

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

  it("should craft an opt-in with 0 amount and assetId", async () => {
    const sender = "SENDER_ADDR";
    const assetId = "12345";

    const result = await craftOptInTransaction(sender, assetId);

    const decoded = decodeTxPayload(result.serializedTransaction);
    expect(decoded.type).toBe("axfer");
    expect(decoded.amt).toBe(0);
    expect(decoded.xaid).toBe(12345);
    expect(Buffer.from(decoded.snd as Uint8Array).toString()).toBe(sender);
    expect(Buffer.from(decoded.arcv as Uint8Array).toString()).toBe(sender);
  });
});

describe("craftApiTransaction", () => {
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

  it("should craft a native ALGO transaction matching the intent", async () => {
    const intent: TransactionIntent<AlgorandMemo> = {
      intentType: "transaction",
      type: "send",
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
      asset: { type: "native" },
    };

    const result = await craftApiTransaction(intent);

    expect(result.transaction).toMatch(/^[a-f0-9]+$/i);

    const decoded = decodeTxPayload(result.transaction);
    expect(decoded.type).toBe("pay");
    expect(decoded.amt).toBe(1000000);
    expect(Buffer.from(decoded.snd as Uint8Array).toString()).toBe(intent.sender);
    expect(Buffer.from(decoded.rcv as Uint8Array).toString()).toBe(intent.recipient);
  });

  it("should craft an ASA transaction matching the intent", async () => {
    const intent: TransactionIntent<AlgorandMemo> = {
      intentType: "transaction",
      type: "send",
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 500n,
      asset: { type: "asa", assetReference: "12345" },
    };

    const result = await craftApiTransaction(intent);

    const decoded = decodeTxPayload(result.transaction);
    expect(decoded.type).toBe("axfer");
    expect(decoded.amt).toBe(500);
    expect(decoded.xaid).toBe(12345);
    expect(Buffer.from(decoded.snd as Uint8Array).toString()).toBe(intent.sender);
    expect(Buffer.from(decoded.arcv as Uint8Array).toString()).toBe(intent.recipient);
  });

  it("should include memo from intent in the payload", async () => {
    const intent: TransactionIntent<AlgorandMemo> = {
      intentType: "transaction",
      type: "send",
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
      asset: { type: "native" },
      memo: { type: "string", kind: "note", value: "hello" },
    };

    const result = await craftApiTransaction(intent);

    const decoded = decodeTxPayload(result.transaction);
    expect(Buffer.from(decoded.note as Uint8Array).toString()).toBe("hello");
  });

  it("should expose txPayload in details", async () => {
    const intent: TransactionIntent<AlgorandMemo> = {
      intentType: "transaction",
      type: "send",
      sender: "SENDER_ADDR",
      recipient: "RECIPIENT_ADDR",
      amount: 1000000n,
      asset: { type: "native" },
    };

    const result = await craftApiTransaction(intent);

    expect(result.details).toHaveProperty("txPayload");
    expect((result.details as { txPayload: { type: string } }).txPayload.type).toBe("pay");
  });

  it("should throw for non-send transaction intents", async () => {
    const intent = {
      intentType: "other",
      type: "stake",
      sender: "SENDER",
      amount: 1000000n,
    } as unknown as TransactionIntent<AlgorandMemo>;

    await expect(craftApiTransaction(intent)).rejects.toThrow(
      "Only send transaction intent is supported",
    );
  });
});
