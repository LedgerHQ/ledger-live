import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { lastBlock } from "./lastBlock";

describe("lastBlock (integ, Cosmos Hub)", () => {
  it("returns a recent block with a positive height and a non-empty hash", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

    const block = await lastBlock(api);

    expect(block.height).toBeGreaterThan(0);
    expect(typeof block.hash).toBe("string");
    expect(block.hash.length).toBeGreaterThan(0);
    expect(block.time).toBeInstanceOf(Date);
  });
});
