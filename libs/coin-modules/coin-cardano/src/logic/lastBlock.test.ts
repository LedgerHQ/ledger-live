import { fetchLatestBlock } from "../api/getLatestBlock";
import { lastBlock } from "./lastBlock";
import { mockCardanoConfig } from "../test/coinConfig";

jest.mock("../api/getLatestBlock");
const mockFetchLatestBlock = jest.mocked(fetchLatestBlock);

describe("lastBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the tip height reported by the API", async () => {
    mockFetchLatestBlock.mockResolvedValue({ blockHeight: 13494170 });

    const result = await lastBlock(mockCardanoConfig);

    expect(result.height).toBe(13494170);
    expect(mockFetchLatestBlock).toHaveBeenCalledWith(mockCardanoConfig);
  });

  it("returns an empty hash (not exposed by the Cardano API)", async () => {
    mockFetchLatestBlock.mockResolvedValue({ blockHeight: 1 });

    const result = await lastBlock(mockCardanoConfig);

    expect(result.hash).toBe("");
  });

  it("approximates the tip timestamp as the current time", async () => {
    mockFetchLatestBlock.mockResolvedValue({ blockHeight: 1 });

    const before = Date.now();
    const result = await lastBlock(mockCardanoConfig);
    const after = Date.now();

    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.time.getTime()).toBeLessThanOrEqual(after);
  });

  it("propagates fetch errors", async () => {
    mockFetchLatestBlock.mockRejectedValue(new Error("network down"));

    await expect(lastBlock(mockCardanoConfig)).rejects.toThrow("network down");
  });

  it.each([
    ["undefined", undefined],
    ["zero", 0],
    ["negative", -1],
    ["NaN", NaN],
    ["non-integer", 12.5],
    ["non-number", "1000"],
  ])("throws on an invalid block height (%s)", async (_label, blockHeight) => {
    mockFetchLatestBlock.mockResolvedValue({ blockHeight } as never);

    await expect(lastBlock(mockCardanoConfig)).rejects.toThrow("invalid block height");
  });
});
