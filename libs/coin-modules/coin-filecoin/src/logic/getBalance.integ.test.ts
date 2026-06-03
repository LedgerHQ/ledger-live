import { TEST_ADDRESSES } from "../test/fixtures";
import { getBalance } from "./getBalance";

describe("getBalance (integration)", () => {
  it("returns Balance[] with at least one native entry", async () => {
    const balances = await getBalance(TEST_ADDRESSES.F1_ADDRESS);

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThanOrEqual(1);

    const native = balances.find(b => b.asset.type === "native");
    expect(native).toBeDefined();
    expect(typeof native!.value).toBe("bigint");
    expect(native!.value).toBeGreaterThanOrEqual(0n);
  });

  it("locked balance is a bigint >= 0", async () => {
    const balances = await getBalance(TEST_ADDRESSES.F1_ADDRESS);
    const native = balances.find(b => b.asset.type === "native");

    expect(typeof native!.locked).toBe("bigint");
    expect(native!.locked).toBeGreaterThanOrEqual(0n);
  });
});
