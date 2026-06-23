import { TEST_ADDRESSES } from "../../test/fixtures";
import { getNextSequence } from "./getNextSequence";

describe("getNextSequence (integration)", () => {
  it("returns a bigint nonce >= 0", async () => {
    const nonce = await getNextSequence(TEST_ADDRESSES.F1_ADDRESS);

    expect(typeof nonce).toBe("bigint");
    expect(nonce).toBeGreaterThanOrEqual(0n);
  });
});
