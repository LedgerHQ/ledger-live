import { lastBlock } from "./lastBlock";
import { mainnetKaspaConfig } from "../../test/context";

describe("lastBlock (integration)", () => {
  it("fetches the current confirmed block from the Kaspa API", async () => {
    const result = await lastBlock(mainnetKaspaConfig);

    expect(result.height).toBeGreaterThan(0);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
  });
});
