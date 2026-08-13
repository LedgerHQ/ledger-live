import { fetchBlockByHeight } from "../../network/blocks";
import { getBlockInfo, toBlockInfo } from "./getBlockInfo";

jest.mock("../../network/blocks");

describe("getBlockInfo", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps the block response to BlockInfo", async () => {
    (fetchBlockByHeight as jest.Mock).mockResolvedValue({
      height: 961566,
      hash: "0xblockhash",
      tenure_height: 40,
      burn_block_time: 1700000000,
      canonical: true,
    });

    await expect(getBlockInfo(961566)).resolves.toEqual({
      height: 961566,
      hash: "0xblockhash",
      time: new Date(1700000000 * 1000),
    });
    expect(fetchBlockByHeight).toHaveBeenCalledWith(961566);
  });

  it("rejects a negative height without calling the network", async () => {
    await expect(getBlockInfo(-1)).rejects.toThrow("stacks: block height must be >= 0");
    expect(fetchBlockByHeight).not.toHaveBeenCalled();
  });

  it("toBlockInfo converts unix seconds to a Date", () => {
    expect(
      toBlockInfo({
        height: 1,
        hash: "0xh",
        tenure_height: 1,
        burn_block_time: 10,
        canonical: true,
      }),
    ).toEqual({ height: 1, hash: "0xh", time: new Date(10000) });
  });
});
