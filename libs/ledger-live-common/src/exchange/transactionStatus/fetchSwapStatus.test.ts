import { getMultipleStatus } from "../swap/getStatus";
import { fetchTransactionSwapStatus } from "./fetchSwapStatus";

jest.mock("../swap/getStatus", () => ({
  getMultipleStatus: jest.fn(),
}));

const mockGetMultipleStatus = getMultipleStatus as jest.MockedFunction<typeof getMultipleStatus>;

describe("fetchTransactionSwapStatus", () => {
  beforeEach(() => {
    mockGetMultipleStatus.mockReset();
  });

  it("calls the batch status endpoint for a single swap id", async () => {
    mockGetMultipleStatus.mockResolvedValueOnce([
      { provider: "lifi", swapId: "swap-1", status: "finished" },
    ]);

    await expect(
      fetchTransactionSwapStatus({ provider: "lifi", swapId: "swap-1" }),
    ).resolves.toEqual({ provider: "lifi", swapId: "swap-1", status: "finished" });

    expect(mockGetMultipleStatus).toHaveBeenCalledWith([{ provider: "lifi", swapId: "swap-1" }]);
  });

  it("forwards optional transaction and operation ids", async () => {
    mockGetMultipleStatus.mockResolvedValueOnce([
      { provider: "lifi", swapId: "swap-1", status: "pending" },
    ]);

    await fetchTransactionSwapStatus({
      provider: "lifi",
      swapId: "swap-1",
      transactionId: "0xhash",
      operationId: "operation-id",
    });

    expect(mockGetMultipleStatus).toHaveBeenCalledWith([
      {
        provider: "lifi",
        swapId: "swap-1",
        transactionId: "0xhash",
        operationId: "operation-id",
      },
    ]);
  });

  it("returns undefined when the backend returns no row", async () => {
    mockGetMultipleStatus.mockResolvedValueOnce([]);

    await expect(
      fetchTransactionSwapStatus({ provider: "lifi", swapId: "swap-1" }),
    ).resolves.toBeUndefined();
  });
});
