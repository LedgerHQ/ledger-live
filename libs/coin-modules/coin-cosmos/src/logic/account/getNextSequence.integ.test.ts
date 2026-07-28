import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { getNextSequence } from "./getNextSequence";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

describe("getNextSequence (integ, Cosmos Hub)", () => {
  it("returns a non-negative integer sequence for a known address", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

    const sequence = await getNextSequence(api, ADDR);

    expect(typeof sequence).toBe("bigint");
    expect(sequence >= 0n).toBe(true);
  });
});
