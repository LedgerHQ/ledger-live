import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
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
});
