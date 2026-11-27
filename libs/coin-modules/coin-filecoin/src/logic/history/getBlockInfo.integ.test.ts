import { BlockNotFoundError, NoBlockAtHeightError } from "@ledgerhq/coin-module-framework/errors";
import { filecoinDefaults } from "../../config";
import { createMockFilecoinContext } from "../../test/context";
import { getBlockInfo } from "./getBlockInfo";

const context = createMockFilecoinContext(filecoinDefaults.filecoin);

describe("getBlockInfo (integration)", () => {
  it("returns the block and its parent", async () => {
    const info = await getBlockInfo(context, 2683349);

    expect(info.height).toBe(2683349);
    expect(info.hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(info.time.getTime()).toBe(Date.parse("2023-03-14T15:14:30.000Z"));
    expect(info.parent?.height).toBe(2683348);
  });

  it("has no parent for the first indexed block", async () => {
    const info = await getBlockInfo(context, 2683348);

    expect(info.height).toBe(2683348);
    expect(info).not.toHaveProperty("parent");
  });

  it("throws BlockNotFoundError before the FEVM upgrade", async () => {
    await expect(getBlockInfo(context, 2683340)).rejects.toBeInstanceOf(BlockNotFoundError);
  });

  it("throws NoBlockAtHeightError for a finalized null round", async () => {
    await expect(getBlockInfo(context, 6573823)).rejects.toBeInstanceOf(NoBlockAtHeightError);
  });

  it("throws NoBlockAtHeightError for a null round older than the lookback limit of the node", async () => {
    await expect(getBlockInfo(context, 6400084)).rejects.toBeInstanceOf(NoBlockAtHeightError);
  });

  it("returns the block after a null round, with the parent before the null round", async () => {
    const info = await getBlockInfo(context, 6573824);

    expect(info.parent?.height).toBe(6573822);
  });
});
