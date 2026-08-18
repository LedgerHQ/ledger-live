import type { ApiResponseBlockInfo, ApiResponseBlockVerboseData } from "../../types";
import { getBlockInfo } from "./getBlockInfo";

const mockGetBlocksFromBlueScore = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getBlocksFromBlueScore: (...args: unknown[]) => mockGetBlocksFromBlueScore(...args),
}));

const HASH_CHAIN = "a".repeat(64);

function makeBlock(verbose: Partial<ApiResponseBlockVerboseData>): ApiResponseBlockInfo {
  return {
    header: {
      version: 2,
      hashMerkleRoot: "",
      acceptedIdMerkleRoot: "",
      utxoCommitment: "",
      timestamp: "1783691947227",
      bits: 0,
      nonce: "0",
      daaScore: "0",
      blueWork: "",
      parents: [],
      blueScore: "480818084",
      pruningPoint: "",
    },
    transactions: [],
    verboseData: {
      hash: HASH_CHAIN,
      difficulty: 0,
      selectedParentHash: "",
      transactionIds: [],
      blueScore: "480818084",
      childrenHashes: null,
      mergeSetBluesHashes: [],
      mergeSetRedsHashes: [],
      isChainBlock: true,
      ...verbose,
    },
  };
}

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches blocks at the given blue score and maps the selected-chain block", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([
      makeBlock({ hash: "b".repeat(64), isChainBlock: false }),
      makeBlock({ hash: HASH_CHAIN, isChainBlock: true }),
    ]);

    const info = await getBlockInfo(480818084);

    expect(mockGetBlocksFromBlueScore).toHaveBeenCalledWith(480818084);
    expect(info.height).toBe(480818084);
    expect(info.hash).toBe(HASH_CHAIN);
    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.getTime()).toBe(1783691947227);
  });

  it("throws when no block exists at the blue score", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([]);

    await expect(getBlockInfo(42)).rejects.toThrow("kaspa: no block at blueScore 42");
  });
});
