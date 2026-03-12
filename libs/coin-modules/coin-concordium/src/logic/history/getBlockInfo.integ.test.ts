import { setupTestnetCoinConfig } from "../../test/fixtures";
import { getBlockInfo } from "./getBlockInfo";

describe("getBlockInfo", () => {
  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  it("returns block info for a given height", async () => {
    const result = await getBlockInfo(1000, "concordium_testnet");

    expect(result.height).toBe(1000);
    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.time).toBeInstanceOf(Date);
  });

  it("includes parent block reference", async () => {
    const result = await getBlockInfo(1000, "concordium_testnet");

    expect(result.parent).not.toBeUndefined();
    expect(result.parent?.height).toBe(999);
    expect(result.parent?.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
  });

  it("does not include parent for height 0", async () => {
    const result = await getBlockInfo(0, "concordium_testnet");

    expect(result.height).toBe(0);
    expect(result.parent).toBeUndefined();
  });

  it("returns consistent results for same height", async () => {
    const result1 = await getBlockInfo(1000, "concordium_testnet");
    const result2 = await getBlockInfo(1000, "concordium_testnet");

    expect(result1.height).toBe(result2.height);
    expect(result1.hash).toBe(result2.hash);
  });
});
