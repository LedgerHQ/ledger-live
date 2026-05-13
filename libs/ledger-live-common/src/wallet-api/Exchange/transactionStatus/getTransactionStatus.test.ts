import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { MappedSwapOperation } from "../../../exchange/swap/types";
import getCompleteSwapHistory from "../../../exchange/swap/getCompleteSwapHistory";
import { fetchTransactionSwapStatus } from "../../../exchange/transactionStatus/fetchSwapStatus";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../../../exchange/swap/getCompleteSwapHistory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../exchange/transactionStatus/fetchSwapStatus", () => ({
  fetchTransactionSwapStatus: jest.fn(),
}));

const mockedGetCompleteSwapHistory = jest.mocked(getCompleteSwapHistory);
const mockedFetchTransactionSwapStatus = jest.mocked(fetchTransactionSwapStatus);

function makeAccount(id: string): Account {
  return {
    type: "Account",
    id,
    subAccounts: [],
    currency: {
      type: "CryptoCurrency",
      id: `${id}-currency`,
      units: [{ code: "TEST", magnitude: 8, name: "TEST" }],
    },
  } as unknown as Account;
}

function makeSwapOperation(overrides: Partial<MappedSwapOperation> = {}): MappedSwapOperation {
  const operation = {
    id: "operation-id",
    hash: "0xhash",
    fee: new BigNumber("21000"),
    date: new Date("2026-01-02T03:04:05.000Z"),
  } as unknown as Operation;

  return {
    provider: "lifi",
    swapId: "swap-1",
    status: "pending",
    fromAccount: makeAccount("from"),
    toAccount: makeAccount("to"),
    toExists: true,
    operation,
    fromAmount: new BigNumber("-100000"),
    toAmount: new BigNumber("200000"),
    finalAmount: new BigNumber("250000"),
    ...overrides,
  };
}

describe("getTransactionStatus", () => {
  beforeEach(() => {
    mockedGetCompleteSwapHistory.mockReset();
    mockedFetchTransactionSwapStatus.mockReset();
  });

  it("resolves provider and display details from wallet swap history, normalizing remote final amount", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([
      { day: new Date("2026-01-02"), data: [makeSwapOperation()] },
    ]);
    mockedFetchTransactionSwapStatus.mockResolvedValueOnce({
      provider: "lifi",
      swapId: "swap-1",
      status: "finished",
      finalAmount: "0.003",
    });

    await expect(
      getTransactionStatus({ swapId: "swap-1" }, { accounts: [makeAccount("from")] }),
    ).resolves.toEqual({
      kind: "swap",
      swapId: "swap-1",
      provider: "lifi",
      status: "finished",
      finalAmount: "300000",
      fromAccountId: "from",
      toAccountId: "to",
      sentAmount: "100000",
      receivedAmount: "250000",
      feesAmount: "21000",
      operationHash: "0xhash",
      createdAt: new Date("2026-01-02T03:04:05.000Z").getTime(),
    });
    expect(mockedFetchTransactionSwapStatus).toHaveBeenCalledWith({
      provider: "lifi",
      swapId: "swap-1",
      transactionId: "0xhash",
      operationId: "operation-id",
    });
  });

  it("uses provider fallback when swap history cannot resolve the swap", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([]);
    mockedFetchTransactionSwapStatus.mockResolvedValueOnce({
      provider: "changelly_v2",
      swapId: "swap-1",
      status: "pending",
    });

    await expect(
      getTransactionStatus(
        { swapId: "swap-1", provider: "changelly_v2" },
        { accounts: [makeAccount("from")] },
      ),
    ).resolves.toEqual({
      kind: "swap",
      swapId: "swap-1",
      provider: "changelly_v2",
      status: "pending",
      finalAmount: undefined,
    });
    expect(mockedFetchTransactionSwapStatus).toHaveBeenCalledWith({
      provider: "changelly_v2",
      swapId: "swap-1",
      transactionId: undefined,
    });
  });

  it("keeps unknown remote status as a first-class status", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([
      { day: new Date("2026-01-02"), data: [makeSwapOperation({ provider: "uniswap" })] },
    ]);
    mockedFetchTransactionSwapStatus.mockResolvedValueOnce({
      provider: "uniswap",
      swapId: "swap-1",
      status: "unknown",
    });

    await expect(
      getTransactionStatus({ swapId: "swap-1" }, { accounts: [makeAccount("from")] }),
    ).resolves.toMatchObject({
      kind: "swap",
      swapId: "swap-1",
      provider: "uniswap",
      status: "unknown",
    });
  });

  it("returns providerRequired when neither args nor history provide a provider", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([]);

    await expect(
      getTransactionStatus({ swapId: "swap-1" }, { accounts: [makeAccount("from")] }),
    ).resolves.toEqual({
      kind: "swap",
      swapId: "swap-1",
      providerRequired: true,
    });
    expect(mockedFetchTransactionSwapStatus).not.toHaveBeenCalled();
  });

  it("keeps local history details when the remote status request fails", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([
      { day: new Date("2026-01-02"), data: [makeSwapOperation()] },
    ]);
    mockedFetchTransactionSwapStatus.mockRejectedValueOnce(new Error("HTTP 429"));

    await expect(
      getTransactionStatus({ swapId: "swap-1" }, { accounts: [makeAccount("from")] }),
    ).resolves.toEqual({
      kind: "swap",
      swapId: "swap-1",
      provider: "lifi",
      status: "pending",
      finalAmount: "250000",
      fromAccountId: "from",
      toAccountId: "to",
      sentAmount: "100000",
      receivedAmount: "250000",
      feesAmount: "21000",
      operationHash: "0xhash",
      createdAt: new Date("2026-01-02T03:04:05.000Z").getTime(),
    });
  });

  it("ignores zero remote final amount so history receive amount remains visible", async () => {
    mockedGetCompleteSwapHistory.mockResolvedValueOnce([
      {
        day: new Date("2026-01-02"),
        data: [makeSwapOperation({ finalAmount: new BigNumber(0), toAmount: new BigNumber("200000") })],
      },
    ]);
    mockedFetchTransactionSwapStatus.mockResolvedValueOnce({
      provider: "lifi",
      swapId: "swap-1",
      status: "finished",
      finalAmount: "0",
    });

    await expect(
      getTransactionStatus({ swapId: "swap-1" }, { accounts: [makeAccount("from")] }),
    ).resolves.toMatchObject({
      status: "finished",
      finalAmount: undefined,
      receivedAmount: "200000",
    });
  });
});
