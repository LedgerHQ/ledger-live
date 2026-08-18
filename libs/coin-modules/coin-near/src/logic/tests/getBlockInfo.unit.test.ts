import { mockNearContext } from "../../test/context";
import { getBlockHeaderAtHeight, getLastBlockHeader } from "../../network";
import { getBlockInfo, toBlockInfo } from "../getBlockInfo";
import { lastBlock } from "../lastBlock";

jest.mock("../../network", () => ({
  getBlockHeaderAtHeight: jest.fn(),
  getLastBlockHeader: jest.fn(),
}));

const HEADER = { height: 140_000_000, hash: "BlockHash1", timestamp: 1_750_000_000_000_000_000 };

describe("toBlockInfo", () => {
  it("converts the nanosecond block timestamp to a date", () => {
    expect(toBlockInfo(HEADER)).toEqual({
      height: 140_000_000,
      hash: "BlockHash1",
      time: new Date(1_750_000_000_000),
    });
  });
});

describe("getBlockInfo", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the header at the requested height", async () => {
    (getBlockHeaderAtHeight as jest.Mock).mockResolvedValue(HEADER);

    await expect(getBlockInfo(mockNearContext, 140_000_000)).resolves.toEqual(toBlockInfo(HEADER));
    expect(getBlockHeaderAtHeight).toHaveBeenCalledWith(expect.anything(), 140_000_000);
  });
});

describe("lastBlock", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the latest final header", async () => {
    (getLastBlockHeader as jest.Mock).mockResolvedValue(HEADER);

    await expect(lastBlock(mockNearContext)).resolves.toEqual(toBlockInfo(HEADER));
    expect(getLastBlockHeader).toHaveBeenCalled();
  });
});
