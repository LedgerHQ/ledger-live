import { getBlockDagInfo, getVirtualChainBlueScore } from "../../network";
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

  it("uses the virtual chain blue score (confirmed height), not the DAG tip's daaScore", async () => {
    mockGetVirtualChainBlueScore.mockResolvedValue(191726843);
    mockGetBlockDagInfo.mockResolvedValue({
      pruningPointHash: "abc123",
      virtualDaaScore: "999999999",
    });

    const result = await lastBlock();

    expect(result.height).toBe(191726843);
    expect(result.hash).toBe("abc123");
    expect(result.time).toBeInstanceOf(Date);
  });

  it("throws when the blue score is not a positive integer", async () => {
    mockGetVirtualChainBlueScore.mockResolvedValue(0);
    mockGetBlockDagInfo.mockResolvedValue({ pruningPointHash: "abc123" });

    await expect(lastBlock()).rejects.toThrow("invalid blue score");
  });

  it("falls back to an empty hash when the pruning point hash is absent", async () => {
    mockGetVirtualChainBlueScore.mockResolvedValue(42);
    mockGetBlockDagInfo.mockResolvedValue({});

    const result = await lastBlock();

    expect(result.hash).toBe("");
  });
});
