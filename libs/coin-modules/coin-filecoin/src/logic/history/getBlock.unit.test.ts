import type { BlockTransaction } from "@ledgerhq/coin-module-framework/api/index";
import {
  BlockNotFoundError,
  InvalidBlockHeightError,
  NoBlockAtHeightError,
} from "@ledgerhq/coin-module-framework/errors";
import { fetchBlockscoutBlock, fetchBlockscoutBlockTransactions } from "../../network/blockscout";
import { fetchFinalizedHeight } from "../../network/lotus";
import { createMockFilecoinContext, mockFilecoinConfig } from "../../test/context";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../../network/blockscout");
jest.mock("../../network/lotus");

const mockedFetchBlock = jest.mocked(fetchBlockscoutBlock);
const mockedFetchTransactions = jest.mocked(fetchBlockscoutBlockTransactions);
const mockedFinalizedHeight = jest.mocked(fetchFinalizedHeight);
const context = createMockFilecoinContext();

const parent = {
  height: 6558811,
  hash: "0x6f37",
  parent_hash: "0x1a49",
  timestamp: "2026-11-18T20:00:00.000000Z",
};
const block = {
  height: 6558813,
  hash: "0xb419",
  parent_hash: parent.hash,
  timestamp: "2026-11-18T20:01:00.000000Z",
};
const transaction: BlockTransaction = {
  hash: "0xtx",
  failed: false,
  operations: [],
  fees: 365510951212n,
  feesPayer: "0xFf000000000000000000000000000000001d5eF4",
};

describe("getBlock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedFetchBlock.mockImplementation(async (_url, heightOrHash) =>
      heightOrHash === parent.hash ? parent : block,
    );
  });

  it("returns the block info and the transactions", async () => {
    mockedFetchTransactions.mockResolvedValueOnce([transaction]);

    const result = await getBlock(context, 6558813);

    expect(result.transactions).toEqual([transaction]);
    expect(mockedFetchTransactions).toHaveBeenCalledWith(mockFilecoinConfig.indexer, block.hash);
  });

  it("reads the transactions of the block of `info`, even if the height changes block after", async () => {
    // A reorg replaces the block of this height between the two requests
    const replacement: BlockTransaction = { ...transaction, hash: "0xreplacement" };
    mockedFetchTransactions.mockImplementation(async (_url, blockHash) =>
      blockHash === block.hash ? [transaction] : [replacement],
    );

    const result = await getBlock(context, 6558813);

    expect(result.info.hash).toBe(block.hash);
    expect(result.transactions).toEqual([transaction]);
  });

  it("returns the same info as getBlockInfo", async () => {
    mockedFetchTransactions.mockResolvedValueOnce([]);

    const result = await getBlock(context, 6558813);

    expect(result.info).toEqual(await getBlockInfo(context, 6558813));
    expect(result.info.parent).toEqual({ height: 6558811, hash: "0x6f37" });
  });

  it("returns a block without transactions", async () => {
    mockedFetchTransactions.mockResolvedValueOnce([]);

    await expect(getBlock(context, 6558813)).resolves.toMatchObject({ transactions: [] });
  });

  it("throws BlockNotFoundError for a height the indexer does not hold", async () => {
    mockedFetchBlock.mockRejectedValue(new BlockNotFoundError());
    mockedFinalizedHeight.mockResolvedValueOnce(6582170);

    await expect(getBlock(context, 2683340)).rejects.toBeInstanceOf(BlockNotFoundError);
    expect(mockedFetchTransactions).not.toHaveBeenCalled();
  });

  it("throws NoBlockAtHeightError for a finalized null round", async () => {
    const next = { ...block, height: 6573824, hash: "0xnext", parent_hash: parent.hash };
    mockedFetchBlock.mockImplementation(async (_url, heightOrHash) => {
      if (heightOrHash === 6573824) return next;
      if (heightOrHash === parent.hash) return { ...parent, height: 6573822 };
      throw new BlockNotFoundError();
    });
    mockedFinalizedHeight.mockResolvedValueOnce(6582170);

    await expect(getBlock(context, 6573823)).rejects.toBeInstanceOf(NoBlockAtHeightError);
    expect(mockedFetchTransactions).not.toHaveBeenCalled();
  });

  it("rethrows a transactions failure", async () => {
    const failure = new Error("Bad gateway");
    mockedFetchTransactions.mockRejectedValueOnce(failure);

    await expect(getBlock(context, 6558813)).rejects.toBe(failure);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects the invalid height %p", async height => {
    await expect(getBlock(context, height)).rejects.toBeInstanceOf(InvalidBlockHeightError);
    expect(mockedFetchBlock).not.toHaveBeenCalled();
    expect(mockedFetchTransactions).not.toHaveBeenCalled();
  });
});
