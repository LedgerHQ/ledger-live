import { getBlock as getBlockFromNetwork } from "../../network";
import { createMockVechainContext, mockVechainConfig } from "../../test/context";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../../network", () => ({ getBlock: jest.fn() }));

const context = createMockVechainContext();

describe("getBlockInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps the network block to BlockInfo", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce({
      id: "0xabc",
      number: 42,
      timestamp: 1_700_000_000,
      transactions: [],
    });

    const info = await getBlockInfo(context, 42);

    expect(getBlockFromNetwork).toHaveBeenCalledWith(mockVechainConfig, 42, false);
    expect(info).toEqual({ height: 42, hash: "0xabc", time: new Date(1_700_000_000 * 1000) });
  });

  it("throws when there is no block at the given height", async () => {
    jest.mocked(getBlockFromNetwork).mockResolvedValueOnce(null);

    await expect(getBlockInfo(context, 999)).rejects.toThrow("vechain: no block at height 999");
  });
});
