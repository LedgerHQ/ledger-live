import { lastBlock } from "../lastBlock";
import * as network from "../../network";
import type { BitcoinContext } from "../../api/config";

jest.mock("../../network");

const mockedGetCurrentBlock = network.getCurrentBlock as jest.MockedFunction<
  typeof network.getCurrentBlock
>;

const config = { status: { type: "active" } };
const context = { config: async () => config } as unknown as BitcoinContext;

const block = (over: Record<string, unknown>) =>
  over as unknown as Awaited<ReturnType<typeof network.getCurrentBlock>>;

describe("logic/lastBlock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps the explorer's current block to a BlockInfo with a Date time", async () => {
    mockedGetCurrentBlock.mockResolvedValue(
      block({ height: 800_000, hash: "0000cafe", time: "2024-06-01T00:00:00Z" }),
    );

    const info = await lastBlock(context, "bitcoin");

    expect(info.height).toBe(800_000);
    expect(info.hash).toBe("0000cafe");
    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.toISOString()).toBe("2024-06-01T00:00:00.000Z");
  });

  it("resolves the per-currency config and passes it to the network layer", async () => {
    mockedGetCurrentBlock.mockResolvedValue(block({ height: 1, hash: "h", time: 0 }));

    await lastBlock(context, "bitcoin");

    expect(mockedGetCurrentBlock).toHaveBeenCalledWith("bitcoin", config);
  });

  it("throws when the explorer reports no current block", async () => {
    mockedGetCurrentBlock.mockResolvedValue(null);

    await expect(lastBlock(context, "bitcoin")).rejects.toThrow(/no current block/);
  });
});
