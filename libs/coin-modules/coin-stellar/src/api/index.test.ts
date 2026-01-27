import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import expect from "expect";
import { StellarMemo } from "../types";
import { createApi, envelopeFromAnyXDR } from "./index";

const mockGetOperations = jest.fn();

jest.mock("../logic/listOperations", () => ({
  listOperations: () => mockGetOperations(),
}));

const CUSTOM_FEES = 300n;
const estimateFeesMock = jest.fn(() => CUSTOM_FEES);
jest.mock("../logic/estimateFees", () => ({
  estimateFees: () => estimateFeesMock(),
}));

const logicCraftTransactionMock = jest.fn((_account: unknown, _transaction: { fee: bigint }) => {
  return { xdr: undefined };
});
jest.mock("../logic/craftTransaction", () => ({
  craftTransaction: (account: unknown, transaction: { fee: bigint }) =>
    logicCraftTransactionMock(account, transaction),
}));

const api = createApi({
  explorer: {
    url: "explorer.com",
    fetchLimit: 200,
  },
  useStaticFees: true,
  enableNetworkLogs: false,
});

const fromGenesisMinHeight = 0;
const fromGenesisOrder = "asc" as const;

describe("operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOperation = {
    asset: { type: "native" },
    tx: {
      hash: "e035a56c32003e3b0e4c9c5499b0750d71d98233ae6ae94323ff0a458b05a30b",
      fees: 0.0291,
      block: {
        hash: "hash",
        time: new Date("2024-03-20T10:00:00Z"),
        height: 10,
      },
      date: new Date("2024-03-20T10:00:00Z"),
    },
    type: "Operation",
    value: 200,
    senders: ["addr"],
    recipients: ["recipient"],
  };

  it("should return 0 operations for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[], ""]);

    // When
    const operations = await api.listOperations("addr", {
      minHeight: fromGenesisMinHeight,
      order: fromGenesisOrder,
    });

    // Then
    expect(operations).toEqual({ items: [], next: undefined });
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 1 operation for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", {
      minHeight: fromGenesisMinHeight,
      order: fromGenesisOrder,
    });

    // Then
    expect(operations).toEqual({ items: [mockOperation], next: undefined });
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should call multiple times listOperations", async () => {
    mockGetOperations
      .mockResolvedValueOnce([[mockOperation], "10"])
      .mockResolvedValueOnce([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", {
      minHeight: fromGenesisMinHeight,
      order: fromGenesisOrder,
    });

    // Then
    expect(operations).toEqual({ items: [mockOperation, mockOperation], next: undefined });
    expect(mockGetOperations).toHaveBeenCalledTimes(2);
  });
});

describe("Testing craftTransaction function", () => {
  beforeEach(() => {
    estimateFeesMock.mockClear();
    logicCraftTransactionMock.mockClear();
  });

  it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
    await api.craftTransaction({ asset: {} } as TransactionIntent<StellarMemo>);
    expect(estimateFeesMock).toHaveBeenCalledTimes(1);
    expect(logicCraftTransactionMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ fee: CUSTOM_FEES }),
    );
  });

  it.each([[1n], [50n], [99n]])(
    "should use custom user fees when user provide them for crafting a transaction",
    async (fees: bigint) => {
      await api.craftTransaction({ asset: {} } as TransactionIntent<StellarMemo>, { value: fees });
      expect(estimateFeesMock).toHaveBeenCalledTimes(0);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ fee: fees }),
      );
    },
  );
});

describe("Testing transaction loading functions", () => {
  it("should deserialize a transaction as expected", async () => {
    const transactionPayloadXDR =
      "esM5l1ROMXXSZr0CJDmyLNsWUIwBFj8m5csqPhBFqXkAAAACAAAAAEFMhHdla/OhHE2CYrF1VVPnLgBThGuzpNFZyYMh" +
      "8L6XAAAAZAAAJ/cAAAkYAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAABHRlc3QAAAABAAAAAAAAAAAAAAAA/QIumXyU" +
      "+Nq3dDZfGCXjgxYI7uvPElz8zGb0gN+vWD8AAAAAAA9CQAAAAAA=";
    const transactionEnvelopeXDR =
      "AAAAAgAAAABBTIR3ZWvzoRxNgmKxdVVT5y4AU4Rrs6TRWcmDIfC+lwAAAGQAACf3AAAJGAAAAAEAAAAAAAAAAAAAAAAA" +
      "AAAAAAAAAQAAAAR0ZXN0AAAAAQAAAAAAAAAAAAAAAP0CLpl8lPjat3Q2Xxgl44MWCO7rzxJc/Mxm9IDfr1g/AAAAAAAP" +
      "QkAAAAAAAAAAAA==";
    const txFromSignaturePayload = envelopeFromAnyXDR(transactionPayloadXDR, "base64");
    const txFromEnvelope = envelopeFromAnyXDR(transactionEnvelopeXDR, "base64");
    expect(txFromEnvelope).toEqual(txFromSignaturePayload);
    expect(txFromEnvelope.toXDR("base64")).toEqual(transactionEnvelopeXDR);
    expect(txFromSignaturePayload.toXDR("base64")).toEqual(transactionEnvelopeXDR);
  });

  it("throw expected error when deserializing an invalid transaction", async () => {
    expect(() => envelopeFromAnyXDR("lulz", "base64")).toThrow(
      "Failed decoding transaction as an envelope (TypeError: XDR Read Error: attempt to read outside the boundary of" +
        " the buffer) or as a signature base: (TypeError: XDR Read Error: attempt to read outside the boundary of the" +
        " buffer)",
    );
  });
});
