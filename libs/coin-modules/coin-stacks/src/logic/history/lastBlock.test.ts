import { fetchBlockByHeight, fetchLatestBlock } from "../../network/blocks";
import { lastBlock } from "./lastBlock";

jest.mock("../../network/blocks");

describe("lastBlock", () => {
  beforeEach(() => jest.clearAllMocks());

  it("falls back to the chain tip's previous block", async () => {
    (fetchLatestBlock as jest.Mock).mockResolvedValue({
      height: 961566,
      hash: "0xtip",
      tenure_height: 40,
      burn_block_time: 1700000000,
      canonical: true,
    });
    (fetchBlockByHeight as jest.Mock).mockResolvedValue({
      height: 961565,
      hash: "0xprevious",
      tenure_height: 40,
      burn_block_time: 1699999995,
      canonical: true,
    });

    await expect(lastBlock()).resolves.toEqual({
      height: 961565,
      hash: "0xprevious",
      time: new Date(1699999995 * 1000),
    });
    expect(fetchBlockByHeight).toHaveBeenCalledWith(961565);
  });

  it("returns the tip itself at genesis (height 0), never a negative height", async () => {
    (fetchLatestBlock as jest.Mock).mockResolvedValue({
      height: 0,
      hash: "0xgenesis",
      tenure_height: 0,
      burn_block_time: 1600000000,
      canonical: true,
    });

    await expect(lastBlock()).resolves.toEqual({
      height: 0,
      hash: "0xgenesis",
      time: new Date(1600000000 * 1000),
    });
    expect(fetchBlockByHeight).not.toHaveBeenCalled();
  });
});
