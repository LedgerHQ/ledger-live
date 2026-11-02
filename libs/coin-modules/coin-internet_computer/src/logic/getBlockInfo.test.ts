import BigNumber from "bignumber.js";
import { fetchBlockHeight, fetchEncodedBlock } from "../network/api";
import { getBlockInfo, toBlockInfo } from "./getBlockInfo";
import { lastBlock } from "./lastBlock";

jest.mock("../network/api", () => ({
  fetchBlockHeight: jest.fn(),
  fetchEncodedBlock: jest.fn(),
}));

const mockFetchBlockHeight = jest.mocked(fetchBlockHeight);
const mockFetchEncodedBlock = jest.mocked(fetchEncodedBlock);

// Mainnet blocks 25132352 and 25132353 as the archive canister encodes them, and the genesis block.
const BLOCK_25132352 = Buffer.from(
  "0a220a20b79c073eec74aec15d75b88bae8a1d240ea6c3d2dbe36d608cbaf6e13c723163120a0887a9e3acdbe4fca5181a6e1a540a220a20e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e3712220a205442dcadb1de34824e0a3000db6228ab21f3ad298caa1d910da0bd56d7f892a51a050880c2d72f220308904e220a089ff5c0acf0a4b89831320a0880ecfaf8bae4fca518",
  "hex",
);
const BLOCK_25132353 = Buffer.from(
  "0a220a20140ba81ec6f5b51f7833b0af174cb580b5faa2e5a5efaa90c5527c6f3e30c802120a0881eacd83dee4fca5181a641a540a220a208a102b388195c2837fa7f17f9b651c67928c82e0e86ba2482ae4ab0b59d09b7c12220a208540d98819a53c75fcdcf7845d4cb7d0c2c24fe4338341656a686716fe10c0ff1a0508da9ed33e220308904e22003a0a0a08000000000000756a",
  "hex",
);
const GENESIS = Buffer.from(
  "120a08d3e591b0de89a4be161a3d122d12220a20529ea51c22e8d66e8302eabd9297b100fdb369109822248bb86939a671fbc55b1a0708828de1efbe042200320a08d3e591b0de89a4be16",
  "hex",
);

afterEach(() => jest.resetAllMocks());

describe("toBlockInfo", () => {
  it("reads the time and parent and hashes the encoding", () => {
    expect(toBlockInfo(25132352, BLOCK_25132352)).toEqual({
      height: 25132352,
      hash: "140ba81ec6f5b51f7833b0af174cb580b5faa2e5a5efaa90c5527c6f3e30c802",
      time: new Date(1750760223449),
      parent: {
        height: 25132351,
        hash: "b79c073eec74aec15d75b88bae8a1d240ea6c3d2dbe36d608cbaf6e13c723163",
      },
    });
  });

  it("gives a block's hash as the next block's parent hash", () => {
    const block = toBlockInfo(25132352, BLOCK_25132352);
    const next = toBlockInfo(25132353, BLOCK_25132353);
    expect(next.parent).toEqual({ height: block.height, hash: block.hash });
  });

  it("leaves the parent out for the genesis block", () => {
    const genesis = toBlockInfo(0, GENESIS);
    expect(genesis).toEqual({
      height: 0,
      hash: "ffca0ecf5e837541c7ee5be431e433ad8e972a7f371e86fbe4f8ad646c7cbcea",
      time: new Date(1620328630192),
    });
  });

  it("rejects a truncated encoding", () => {
    expect(() => toBlockInfo(1, BLOCK_25132352.subarray(0, 10))).toThrow(/Truncated/);
  });

  it("rejects a block without a timestamp", () => {
    // A lone parent-hash field (1), no timestamp field (2).
    const parentOnly = Buffer.from("0a220a20" + "00".repeat(32), "hex");
    expect(() => toBlockInfo(1, parentOnly)).toThrow(/no timestamp/);
  });
});

describe("getBlockInfo", () => {
  it("decodes the block fetched at the height", async () => {
    mockFetchEncodedBlock.mockResolvedValue(BLOCK_25132352);
    const info = await getBlockInfo(25132352);
    expect(mockFetchEncodedBlock).toHaveBeenCalledWith(25132352n);
    expect(info.hash).toBe("140ba81ec6f5b51f7833b0af174cb580b5faa2e5a5efaa90c5527c6f3e30c802");
  });

  it("throws above the chain tip", async () => {
    mockFetchEncodedBlock.mockResolvedValue(undefined);
    await expect(getBlockInfo(99)).rejects.toThrow(/No block at height 99/);
  });
});

describe("lastBlock", () => {
  it("reads the block just below the chain length", async () => {
    mockFetchBlockHeight.mockResolvedValue(BigNumber(25132353));
    mockFetchEncodedBlock.mockResolvedValue(BLOCK_25132352);
    const info = await lastBlock();
    expect(mockFetchEncodedBlock).toHaveBeenCalledWith(25132352n);
    expect(info.height).toBe(25132352);
  });
});
