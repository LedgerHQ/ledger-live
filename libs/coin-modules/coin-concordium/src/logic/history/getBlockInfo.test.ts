import { getBlockInfo } from "./getBlockInfo";
import { createFixtureContext } from "../../test/fixtures";

jest.mock("../../network/proxyClient", () => ({
  getBlocksAtHeight: jest.fn(),
  getBlockInfoByHash: jest.fn(),
}));

const { getBlocksAtHeight: getBlocksAtHeightMock, getBlockInfoByHash: getBlockInfoByHashMock } =
  jest.requireMock("../../network/proxyClient");

const context = createFixtureContext();

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info with parent derived from blockParent hash", async () => {
    // GIVEN
    getBlocksAtHeightMock.mockResolvedValue(["abc123"]);
    getBlockInfoByHashMock
      .mockResolvedValueOnce({
        blockHash: "abc123",
        blockHeight: 2000,
        blockSlotTime: "2024-01-12T00:00:00.000Z",
        blockParent: "parent123",
      })
      .mockResolvedValueOnce({
        blockHash: "parent123",
        blockHeight: 1999,
        blockSlotTime: "2024-01-11T00:00:00.000Z",
        blockParent: "grandparent",
      });

    // WHEN
    const result = await getBlockInfo(context, 2000);

    // THEN
    expect(getBlocksAtHeightMock).toHaveBeenCalledTimes(1);
    expect(getBlocksAtHeightMock).toHaveBeenCalledWith(context, 2000);
    expect(getBlockInfoByHashMock).toHaveBeenCalledWith(context, "abc123");
    expect(getBlockInfoByHashMock).toHaveBeenCalledWith(context, "parent123");
    expect(result).toEqual({
      height: 2000,
      hash: "abc123",
      time: new Date("2024-01-12T00:00:00.000Z"),
      parent: { height: 1999, hash: "parent123" },
    });
  });

  it("should not include parent for height 0", async () => {
    // GIVEN
    getBlocksAtHeightMock.mockResolvedValue(["genesis"]);
    getBlockInfoByHashMock.mockResolvedValue({
      blockHash: "genesis",
      blockHeight: 0,
      blockSlotTime: "2022-06-13T10:00:00.000Z",
      blockParent: "",
    });

    // WHEN
    const result = await getBlockInfo(context, 0);

    // THEN
    expect(getBlockInfoByHashMock).toHaveBeenCalledTimes(1);
    expect(result.parent).toBeUndefined();
  });

  it("should throw when no blocks found at height", async () => {
    // GIVEN
    getBlocksAtHeightMock.mockResolvedValue([]);

    // WHEN / THEN
    await expect(getBlockInfo(context, 9999)).rejects.toThrow("No blocks found at height 9999");
  });
});
