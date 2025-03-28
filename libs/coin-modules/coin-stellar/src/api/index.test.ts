import { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { StellarToken } from "../types";
import { createApi } from "./index";

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

const fromGenesis = { minHeight: 0 };

describe("operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOperation = {
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
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 1 operation for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[mockOperation], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 0 operations if start is greater than the last operation", async () => {
    mockGetOperations.mockResolvedValue([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", { minHeight: 100 });

    // Then
    expect(operations).toEqual([[], ""]);
  });

  it("should call multiple times listOperations", async () => {
    mockGetOperations
      .mockResolvedValueOnce([[mockOperation], "10"])
      .mockResolvedValueOnce([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[mockOperation, mockOperation], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(2);
  });
});

describe("Testing craftTransaction function", () => {
  beforeEach(() => {
    estimateFeesMock.mockClear();
    logicCraftTransactionMock.mockClear();
  });

  it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
    await api.craftTransaction({} as TransactionIntent<StellarToken>);
    expect(estimateFeesMock).toHaveBeenCalledTimes(1);
    expect(logicCraftTransactionMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ fee: CUSTOM_FEES }),
    );
  });

  it.each([[1n], [50n], [99n]])(
    "should use custom user fees when user provide them for crafting a transaction",
    async (fees: bigint) => {
      await api.craftTransaction({} as TransactionIntent<StellarToken>, fees);
      expect(estimateFeesMock).toHaveBeenCalledTimes(0);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ fee: fees }),
      );
    },
  );
});
