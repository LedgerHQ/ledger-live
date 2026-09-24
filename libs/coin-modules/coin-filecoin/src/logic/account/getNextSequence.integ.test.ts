import { TEST_ADDRESSES } from "../../test/fixtures";
import { getNextSequence } from "./getNextSequence";
import { mainnetFilecoinConfig } from "../../test/context";

describe("getNextSequence (integration)", () => {
  it("returns a bigint nonce >= 0", async () => {
    const nonce = await getNextSequence(mainnetFilecoinConfig, TEST_ADDRESSES.F1_ADDRESS);

    expect(typeof nonce).toBe("bigint");
    expect(nonce).toBeGreaterThanOrEqual(0n);
  });
});
