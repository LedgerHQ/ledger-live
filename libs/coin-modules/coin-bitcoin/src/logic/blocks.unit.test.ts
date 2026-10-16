import { fakeExplorer } from "../test/fakeExplorer";
import { getBlockInfo, lastBlock } from "./blocks";

describe("blocks", () => {
  it("reads the tip", async () => {
    expect(await lastBlock(fakeExplorer())).toEqual({
      height: 800_000,
      hash: "tip-hash",
      time: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("reads a block by height", async () => {
    expect(await getBlockInfo(fakeExplorer(), 12)).toEqual({
      height: 12,
      hash: "hash-12",
      time: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("fails on an unknown height", async () => {
    const explorer = fakeExplorer();
    (explorer.getBlockByHeight as jest.Mock).mockResolvedValue(null);
    await expect(getBlockInfo(explorer, 99)).rejects.toThrow("Block 99 not found");
  });
});
