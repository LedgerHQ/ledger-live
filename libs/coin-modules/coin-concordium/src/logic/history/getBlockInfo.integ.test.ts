import { concordiumDefaults } from "../../config";
import { getBlockInfo } from "./getBlockInfo";
import { createFixtureContext } from "../../test/fixtures";

describe("getBlockInfo", () => {
  const context = createFixtureContext(concordiumDefaults.concordium_testnet);

  it("returns block info for a given height", async () => {
    const result = await getBlockInfo(context, 1000);

    expect(result.height).toBe(1000);
    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.time).toBeInstanceOf(Date);
  });

  it("includes parent block reference", async () => {
    const result = await getBlockInfo(context, 1000);

    expect(result.parent).not.toBeUndefined();
    expect(result.parent?.height).toBe(999);
    expect(result.parent?.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
  });

  it("does not include parent for height 0", async () => {
    const result = await getBlockInfo(context, 0);

    expect(result.height).toBe(0);
    expect(result.parent).toBeUndefined();
  });

  it("returns consistent results for same height", async () => {
    const result1 = await getBlockInfo(context, 1000);
    const result2 = await getBlockInfo(context, 1000);

    expect(result1.height).toBe(result2.height);
    expect(result1.hash).toBe(result2.hash);
  });
});
