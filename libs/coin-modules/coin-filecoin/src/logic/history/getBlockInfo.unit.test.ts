import {
  InvalidBlockHeightError,
  BlockNotFoundError,
  NoBlockAtHeightError,
} from "@ledgerhq/coin-module-framework/errors";
import { fetchBlockscoutBlock, fetchBlockscoutHeadHeight } from "../../network/blockscout";
import { createMockFilecoinContext, mockFilecoinConfig } from "../../test/context";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../../network/blockscout");

const mockedFetch = jest.mocked(fetchBlockscoutBlock);
const mockedHeadHeight = jest.mocked(fetchBlockscoutHeadHeight);
const context = createMockFilecoinContext();
const INDEXER_URL = mockFilecoinConfig.indexer.url;
const HEAD_HEIGHT = 6583056;
const FINAL_HEIGHT = HEAD_HEIGHT - 900;

type IndexedBlock = Awaited<ReturnType<typeof fetchBlockscoutBlock>>;

function indexedBlock(height: number, parentHeight: number): IndexedBlock {
  return {
    height,
    hash: `0x${height}`,
    parent_hash: `0x${parentHeight}`,
    timestamp: "2026-11-18T20:01:00.000000Z",
  };
}

/** Blockscout holds these blocks, and answers 404 (BlockNotFoundError) for any other height or hash. */
function indexerHolds(...blocks: IndexedBlock[]) {
  mockedFetch.mockImplementation(async (_url, heightOrHash) => {
    const block = blocks.find(b => b.height === heightOrHash || b.hash === heightOrHash);
    if (!block) throw new BlockNotFoundError(`Block ${heightOrHash} not found on the indexer`);
    return block;
  });
}

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedHeadHeight.mockResolvedValue(HEAD_HEIGHT);
  });

  it("maps the block, and takes the parent height from the parent block (null round)", async () => {
    indexerHolds(indexedBlock(6558811, 6558810), indexedBlock(6558813, 6558811));

    const info = await getBlockInfo(context, 6558813);

    expect(info).toEqual({
      height: 6558813,
      hash: "0x6558813",
      time: new Date("2026-11-18T20:01:00.000000Z"),
      parent: { height: 6558811, hash: "0x6558811" },
    });
    expect(mockedFetch).toHaveBeenNthCalledWith(1, INDEXER_URL, 6558813);
    expect(mockedFetch).toHaveBeenNthCalledWith(2, INDEXER_URL, "0x6558811");
  });

  it("does not read the head for a height that has a block", async () => {
    indexerHolds(indexedBlock(6558811, 6558810), indexedBlock(6558813, 6558811));

    await getBlockInfo(context, 6558813);

    expect(mockedHeadHeight).not.toHaveBeenCalled();
  });

  it("omits the parent when it is not indexed (first indexed block)", async () => {
    indexerHolds(indexedBlock(2683348, 2683347));

    const info = await getBlockInfo(context, 2683348);

    expect(info.height).toBe(2683348);
    expect(info).not.toHaveProperty("parent");
  });

  it("rethrows a parent lookup failure that is not a 404", async () => {
    const failure = new Error("Bad gateway");
    mockedFetch
      .mockResolvedValueOnce(indexedBlock(6558813, 6558811))
      .mockRejectedValueOnce(failure);

    await expect(getBlockInfo(context, 6558813)).rejects.toBe(failure);
  });

  describe("on a height that Blockscout does not hold", () => {
    it("throws NoBlockAtHeightError for a null round 900 epochs or more below the head", async () => {
      indexerHolds(indexedBlock(6573822, 6573821), indexedBlock(6573824, 6573822));

      const failure = getBlockInfo(context, 6573823);

      await expect(failure).rejects.toBeInstanceOf(NoBlockAtHeightError);
      await expect(failure).rejects.toHaveProperty("cause", expect.any(BlockNotFoundError));
      expect(mockedHeadHeight).toHaveBeenCalledWith(INDEXER_URL);
    });

    it("throws NoBlockAtHeightError for each round of consecutive null rounds", async () => {
      indexerHolds(indexedBlock(6573820, 6573819), indexedBlock(6573823, 6573820));

      await expect(getBlockInfo(context, 6573821)).rejects.toBeInstanceOf(NoBlockAtHeightError);
      await expect(getBlockInfo(context, 6573822)).rejects.toBeInstanceOf(NoBlockAtHeightError);
    });

    it("throws BlockNotFoundError for a null round less than 900 epochs below the head", async () => {
      const height = FINAL_HEIGHT + 1;
      indexerHolds(indexedBlock(height - 1, height - 2), indexedBlock(height + 1, height - 1));

      await expect(getBlockInfo(context, height)).rejects.toBeInstanceOf(BlockNotFoundError);
    });

    it("throws NoBlockAtHeightError for a null round exactly 900 epochs below the head", async () => {
      indexerHolds(
        indexedBlock(FINAL_HEIGHT - 1, FINAL_HEIGHT - 2),
        indexedBlock(FINAL_HEIGHT + 1, FINAL_HEIGHT - 1),
      );

      await expect(getBlockInfo(context, FINAL_HEIGHT)).rejects.toBeInstanceOf(
        NoBlockAtHeightError,
      );
    });

    it("throws BlockNotFoundError when the next block has the missing height as parent", async () => {
      indexerHolds(indexedBlock(6573822, 6573821), indexedBlock(6573824, 6573823));

      await expect(getBlockInfo(context, 6573823)).rejects.toBeInstanceOf(BlockNotFoundError);
    });

    it("throws BlockNotFoundError when Blockscout holds no block above the missing height", async () => {
      indexerHolds(indexedBlock(6573822, 6573821));

      await expect(getBlockInfo(context, 6573823)).rejects.toBeInstanceOf(BlockNotFoundError);
    });

    it("throws BlockNotFoundError for a height before the FEVM upgrade", async () => {
      indexerHolds(indexedBlock(2683348, 2683347));

      await expect(getBlockInfo(context, 2683340)).rejects.toBeInstanceOf(BlockNotFoundError);
      await expect(getBlockInfo(context, 2683347)).rejects.toBeInstanceOf(BlockNotFoundError);
    });

    it("rethrows a failure of Blockscout while it reads the head", async () => {
      const headFailure = new Error("Bad gateway");
      indexerHolds(indexedBlock(6573822, 6573821), indexedBlock(6573824, 6573822));
      mockedHeadHeight.mockRejectedValueOnce(headFailure);

      await expect(getBlockInfo(context, 6573823)).rejects.toBe(headFailure);
    });

    it("rethrows a failure of Blockscout while it looks for the next block", async () => {
      const indexerFailure = new Error("Bad gateway");
      mockedFetch
        .mockRejectedValueOnce(new BlockNotFoundError())
        .mockRejectedValueOnce(indexerFailure);

      await expect(getBlockInfo(context, 6573823)).rejects.toBe(indexerFailure);
    });
  });

  it("does not read the head when Blockscout fails with another error", async () => {
    const indexerFailure = new Error("Bad gateway");
    mockedFetch.mockRejectedValueOnce(indexerFailure);

    await expect(getBlockInfo(context, 6573823)).rejects.toBe(indexerFailure);
    expect(mockedHeadHeight).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects the invalid height %p", async height => {
    await expect(getBlockInfo(context, height)).rejects.toBeInstanceOf(InvalidBlockHeightError);
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
