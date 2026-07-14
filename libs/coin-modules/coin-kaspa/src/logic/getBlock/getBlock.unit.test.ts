import type {
  ApiResponseBlockInfo,
  ApiResponseBlockTransaction,
  ApiResponseBlockTxOutput,
} from "../../types";
import { getBlock } from "./getBlock";

const mockGetBlocksFromBlueScore = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getBlocksFromBlueScore: (...args: unknown[]) => mockGetBlocksFromBlueScore(...args),
}));

const HASH_CHAIN = "a".repeat(64);
const ADDR = "kaspa:qpy827u4r43hp36nu2w78dphwgzjr3e9xdwwvm7k7dalyhpfkr84qucn4ecud";

function output(address: string | null, amount: number | null): ApiResponseBlockTxOutput {
  return {
    amount,
    scriptPublicKey: null,
    verboseData: address === null ? null : { scriptPublicKeyType: "pubkey", scriptPublicKeyAddress: address },
  };
}

function tx(
  outputs: ApiResponseBlockTxOutput[],
  overrides: Partial<ApiResponseBlockTransaction> = {},
): ApiResponseBlockTransaction {
  return {
    inputs: null,
    outputs,
    subnetworkId: null,
    mass: 0,
    version: 0,
    verboseData: {
      transactionId: "tx-hash",
      hash: null,
      computeMass: 1967,
      blockHash: null,
      blockTime: null,
    },
    ...overrides,
  };
}

function makeBlock(
  transactions: ApiResponseBlockTransaction[],
  isChainBlock = true,
): ApiResponseBlockInfo {
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
    transactions,
    verboseData: {
      hash: HASH_CHAIN,
      difficulty: 0,
      selectedParentHash: "",
      transactionIds: [],
      blueScore: "480818084",
      childrenHashes: null,
      mergeSetBluesHashes: [],
      mergeSetRedsHashes: [],
      isChainBlock,
    },
  };
}

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests transactions and returns block info alongside them", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([makeBlock([tx([output(ADDR, 100)])])]);

    const block = await getBlock(480818084);

    expect(mockGetBlocksFromBlueScore).toHaveBeenCalledWith(480818084, true);
    expect(block.info.height).toBe(480818084);
    expect(block.info.hash).toBe(HASH_CHAIN);
    expect(block.transactions).toHaveLength(1);
  });

  it("maps each output to an incoming native transfer operation", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([
      makeBlock([tx([output(ADDR, 254705948)], { verboseData: { transactionId: "abc", hash: null, computeMass: 0, blockHash: null, blockTime: null } })]),
    ]);

    const { transactions } = await getBlock(480818084);
    const [tx0] = transactions;

    expect(tx0.hash).toBe("abc");
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(0n);
    expect(tx0.operations).toEqual([
      { type: "transfer", address: ADDR, asset: { type: "native" }, amount: 254705948n },
    ]);
  });

  it("skips outputs that have no resolved address", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([
      makeBlock([tx([output(ADDR, 100), output(null, 999)])]),
    ]);

    const { operations } = (await getBlock(480818084)).transactions[0];

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({ address: ADDR, amount: 100n });
  });

  it("returns an empty transactions array when the block has none", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([makeBlock([])]);

    expect((await getBlock(480818084)).transactions).toEqual([]);
  });

  it("selects the chain block when several blocks share the blue score", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([
      makeBlock([tx([output(ADDR, 1)])], false),
      makeBlock([], true),
    ]);

    // the chain block (2nd) has no transactions
    expect((await getBlock(480818084)).transactions).toEqual([]);
  });

  it("defensively handles null outputs, amount, and mass fields", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([
      makeBlock([
        // outputs null -> no operations
        tx(null as unknown as ApiResponseBlockTxOutput[], { mass: null }),
        // amount null -> 0n
        tx([output(ADDR, null)]),
      ]),
    ]);

    const { transactions } = await getBlock(480818084);

    expect(transactions[0].operations).toEqual([]);
    expect(transactions[0].details).toEqual({ mass: undefined, computeMass: 1967 });
    expect(transactions[1].operations[0].amount).toBe(0n);
  });

  it("returns an empty transactions array when the block's transactions field is null", async () => {
    const block = makeBlock([]);
    (block as { transactions: unknown }).transactions = null;
    mockGetBlocksFromBlueScore.mockResolvedValue([block]);

    expect((await getBlock(480818084)).transactions).toEqual([]);
  });

  it("throws when no block exists at the blue score", async () => {
    mockGetBlocksFromBlueScore.mockResolvedValue([]);

    await expect(getBlock(42)).rejects.toThrow("kaspa: no block at blueScore 42");
  });
});
