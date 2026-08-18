import type { ApiResponseBlockInfo, ApiResponseBlockVerboseData } from "../../types";
import { pickChainBlock, toBlockInfo } from "./blockInfo";

const HASH_CHAIN = "a".repeat(64);
const HASH_SIDE = "b".repeat(64);

function makeBlock(
  verbose: Partial<ApiResponseBlockVerboseData>,
  timestamp = "1783691947227",
): ApiResponseBlockInfo {
  return {
    header: {
      version: 2,
      hashMerkleRoot: "",
      acceptedIdMerkleRoot: "",
      utxoCommitment: "",
      timestamp,
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
      isChainBlock: false,
      ...verbose,
    },
  };
}

describe("pickChainBlock", () => {
  it("picks the selected-chain block when a blue score maps to several blocks", () => {
    const side = makeBlock({ hash: HASH_SIDE, isChainBlock: false });
    const chain = makeBlock({ hash: HASH_CHAIN, isChainBlock: true });

    const picked = pickChainBlock([side, chain], 480818084);

    expect(picked.verboseData.hash).toBe(HASH_CHAIN);
    expect(picked.verboseData.isChainBlock).toBe(true);
  });

  it("falls back to the first block when none is flagged as a chain block", () => {
    const first = makeBlock({ hash: HASH_SIDE, isChainBlock: false });
    const second = makeBlock({ hash: HASH_CHAIN, isChainBlock: false });

    expect(pickChainBlock([first, second], 1).verboseData.hash).toBe(HASH_SIDE);
  });

  it("throws when no block exists at the blue score (empty array)", () => {
    expect(() => pickChainBlock([], 42)).toThrow("kaspa: no block at blueScore 42");
  });

  it("throws when the response is not an array", () => {
    expect(() => pickChainBlock(undefined as unknown as ApiResponseBlockInfo[], 42)).toThrow(
      "kaspa: no block at blueScore 42",
    );
  });
});

describe("toBlockInfo", () => {
  it("maps hash from verboseData and height from the requested blue score", () => {
    const info = toBlockInfo(makeBlock({ hash: HASH_CHAIN }), 480818084);

    expect(info.height).toBe(480818084);
    expect(info.hash).toBe(HASH_CHAIN);
  });

  it("parses the millisecond string timestamp into a Date", () => {
    const info = toBlockInfo(makeBlock({}, "1783691947227"), 1);

    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.getTime()).toBe(1783691947227);
  });
});
