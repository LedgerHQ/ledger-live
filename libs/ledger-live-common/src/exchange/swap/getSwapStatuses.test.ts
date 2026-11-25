import { getMultipleStatus } from "./getStatus";
import { getSwapStatuses } from "./getSwapStatuses";

jest.mock("./getStatus", () => ({ getMultipleStatus: jest.fn() }));
const mockedGetMultipleStatus = jest.mocked(getMultipleStatus);

const ORDER_HASH = "0xorderhash";

describe("getSwapStatuses", () => {
  beforeEach(() => mockedGetMultipleStatus.mockReset());

  it("sends the network only with oneinchfusion requests", async () => {
    mockedGetMultipleStatus.mockResolvedValue([]);

    await getSwapStatuses(
      [
        { provider: "oneinchfusion", swapId: ORDER_HASH },
        { provider: "changelly", swapId: "cex-swap" },
      ],
      "ethereum",
    );

    expect(mockedGetMultipleStatus).toHaveBeenCalledWith([
      { provider: "oneinchfusion", swapId: ORDER_HASH, network: "ethereum" },
      { provider: "changelly", swapId: "cex-swap" },
    ]);
  });

  it("asks an unknown oneinch swap again as oneinchfusion", async () => {
    mockedGetMultipleStatus
      .mockResolvedValueOnce([{ provider: "oneinch", swapId: ORDER_HASH, status: "unknown" }])
      .mockResolvedValueOnce([
        { provider: "oneinchfusion", swapId: ORDER_HASH, status: "finished", txHash: "0xfill" },
      ]);

    const statuses = await getSwapStatuses(
      [{ provider: "oneinch", swapId: ORDER_HASH }],
      "ethereum",
    );

    expect(mockedGetMultipleStatus).toHaveBeenLastCalledWith([
      { provider: "oneinchfusion", swapId: ORDER_HASH, network: "ethereum" },
    ]);
    expect(statuses).toEqual([
      { provider: "oneinch", swapId: ORDER_HASH, status: "finished", txHash: "0xfill" },
    ]);
  });

  it("keeps unknown when the oneinch swap is not a Fusion order either", async () => {
    const unknown = { provider: "oneinch", swapId: ORDER_HASH, status: "unknown" as const };
    mockedGetMultipleStatus
      .mockResolvedValueOnce([unknown])
      .mockResolvedValueOnce([{ ...unknown, provider: "oneinchfusion" }]);

    const statuses = await getSwapStatuses(
      [{ provider: "oneinch", swapId: ORDER_HASH }],
      "ethereum",
    );

    expect(statuses).toEqual([unknown]);
  });

  it("returns the oneinch swap as pending when asking again as oneinchfusion fails", async () => {
    const cexSwap = { provider: "changelly", swapId: "cex-swap", status: "finished" as const };
    mockedGetMultipleStatus
      .mockResolvedValueOnce([
        { provider: "oneinch", swapId: ORDER_HASH, status: "unknown" },
        cexSwap,
      ])
      .mockRejectedValueOnce(new Error("network"));

    await expect(
      getSwapStatuses(
        [
          { provider: "oneinch", swapId: ORDER_HASH },
          { provider: "changelly", swapId: "cex-swap" },
        ],
        "ethereum",
      ),
    ).resolves.toEqual([{ provider: "oneinch", swapId: ORDER_HASH, status: "pending" }, cexSwap]);
  });

  it("does not ask again for a resolved oneinch swap or without a network", async () => {
    mockedGetMultipleStatus.mockResolvedValueOnce([
      { provider: "oneinch", swapId: "0xclassic", status: "finished" },
    ]);
    await getSwapStatuses([{ provider: "oneinch", swapId: "0xclassic" }], "ethereum");

    mockedGetMultipleStatus.mockResolvedValueOnce([
      { provider: "oneinch", swapId: ORDER_HASH, status: "unknown" },
    ]);
    await getSwapStatuses([{ provider: "oneinch", swapId: ORDER_HASH }], undefined);

    expect(mockedGetMultipleStatus).toHaveBeenCalledTimes(2);
  });
});
