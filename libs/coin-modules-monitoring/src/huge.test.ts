import { getCoinModuleApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/index";
import { measureThroughput } from "./huge";

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/api/index", () => ({
  getCoinModuleApi: jest.fn(),
}));

function mockPages(pages: { items: number; next?: string }[]) {
  const listOperations = jest.fn();
  for (const { items, next } of pages) {
    listOperations.mockResolvedValueOnce({
      items: Array.from({ length: items }, () => ({})),
      next,
    });
  }
  jest.mocked(getCoinModuleApi).mockResolvedValue({ listOperations } as never);
  return listOperations;
}

describe("measureThroughput", () => {
  it("walks the pages until the history is exhausted", async () => {
    const listOperations = mockPages([
      { items: 100, next: "a" },
      { items: 0, next: "b" },
      { items: 40, next: "" },
    ]);

    const throughput = await measureThroughput("ethereum", "evm", "0xaddress");

    expect(throughput).toEqual({
      operations: 140,
      pageDurations: [expect.any(Number), expect.any(Number), expect.any(Number)],
      exhausted: true,
    });
    // evm supports `limit`, so it gets the same page size as the bridge
    expect(listOperations.mock.calls.map(([, , options]) => options)).toEqual([
      { minHeight: 0, cursor: undefined, order: "desc", limit: 100 },
      { minHeight: 0, cursor: "a", order: "desc", limit: 100 },
      { minHeight: 0, cursor: "b", order: "desc", limit: 100 },
    ]);
  });

  it("stops when the budget is spent", async () => {
    mockPages([
      { items: 100, next: "a" },
      { items: 100, next: "b" },
    ]);

    const throughput = await measureThroughput("ethereum", "evm", "0xaddress", 0);

    expect(throughput).toEqual({
      operations: 100,
      pageDurations: [expect.any(Number)],
      exhausted: false,
    });
  });

  it("sends no limit to a family not known to support it", async () => {
    const listOperations = mockPages([{ items: 10 }]);

    await measureThroughput("solana", "solana", "address");

    expect(listOperations).toHaveBeenCalledWith(expect.anything(), "address", {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
    });
  });
});
