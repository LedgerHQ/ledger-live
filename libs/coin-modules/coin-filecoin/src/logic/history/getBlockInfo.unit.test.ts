import {
  InvalidBlockHeightError,
  BlockNotFoundError,
} from "@ledgerhq/coin-module-framework/errors";
import { fetchBlockscoutBlock } from "../../network/blockscout";
import { createMockFilecoinContext, mockFilecoinConfig } from "../../test/context";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../../network/blockscout");

const mockedFetch = jest.mocked(fetchBlockscoutBlock);
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

describe("getBlockInfo", () => {
  beforeEach(() => jest.resetAllMocks());

  it("maps the block, and takes the parent height from the parent block (null round)", async () => {
    mockedFetch.mockResolvedValueOnce(block).mockResolvedValueOnce(parent);

    const info = await getBlockInfo(context, 6558813);

    expect(info).toEqual({
      height: 6558813,
      hash: "0xb419",
      time: new Date("2026-11-18T20:01:00.000000Z"),
      parent: { height: 6558811, hash: "0x6f37" },
    });
    expect(mockedFetch).toHaveBeenNthCalledWith(1, mockFilecoinConfig.indexer.url, 6558813);
    expect(mockedFetch).toHaveBeenNthCalledWith(2, mockFilecoinConfig.indexer.url, "0x6f37");
  });

  it("omits the parent when it is not indexed (first indexed block)", async () => {
    mockedFetch
      .mockResolvedValueOnce({ ...block, height: 2683348 })
      .mockRejectedValueOnce(new BlockNotFoundError());

    const info = await getBlockInfo(context, 2683348);

    expect(info.height).toBe(2683348);
    expect(info).not.toHaveProperty("parent");
  });

  it("throws BlockNotFoundError for a height the indexer does not hold", async () => {
    mockedFetch.mockRejectedValueOnce(new BlockNotFoundError());

    await expect(getBlockInfo(context, 2683340)).rejects.toBeInstanceOf(BlockNotFoundError);
  });

  it("rethrows a parent lookup failure that is not a 404", async () => {
    const failure = new Error("Bad gateway");
    mockedFetch.mockResolvedValueOnce(block).mockRejectedValueOnce(failure);

    await expect(getBlockInfo(context, 6558813)).rejects.toBe(failure);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects the invalid height %p", async height => {
    await expect(getBlockInfo(context, height)).rejects.toBeInstanceOf(InvalidBlockHeightError);
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
