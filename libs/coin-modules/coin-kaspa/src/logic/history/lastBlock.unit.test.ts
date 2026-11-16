import { lastBlock } from "./lastBlock";

const mockGetBlockDagInfo = jest.fn();
const mockGetVirtualChainBlueScore = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getBlockDagInfo: (...args: unknown[]) => mockGetBlockDagInfo(...args),
  getVirtualChainBlueScore: (...args: unknown[]) => mockGetVirtualChainBlueScore(...args),
}));

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the chain tip (sink) with its blue score, not the pruning point or daaScore", async () => {
    mockGetVirtualChainBlueScore.mockResolvedValue(191726843);
    mockGetBlockDagInfo.mockResolvedValue({
      sink: "tip123",
      pruningPointHash: "pruning456",
      virtualDaaScore: "999999999",
    });

    const result = await lastBlock();

    expect(result.height).toBe(191726843);
    expect(result.hash).toBe("tip123");
    expect(result.time).toBeInstanceOf(Date);
  });

  it("throws when the blue score is not a positive integer", async () => {
    mockGetVirtualChainBlueScore.mockResolvedValue(0);
    mockGetBlockDagInfo.mockResolvedValue({ sink: "tip123" });

    await expect(lastBlock()).rejects.toThrow("invalid blue score");
  });

  it.each([
    ["absent", {}],
    ["empty", { sink: "" }],
  ])("throws when the sink is %s", async (_label, blockDagInfo) => {
    mockGetVirtualChainBlueScore.mockResolvedValue(42);
    mockGetBlockDagInfo.mockResolvedValue(blockDagInfo);

    await expect(lastBlock()).rejects.toThrow("missing sink hash");
  });
});
