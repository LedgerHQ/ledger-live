import { createFixtureConfig } from "../../test/fixtures";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  const config = createFixtureConfig();

  it("returns last block info", async () => {
    const result = await lastBlock(config, "concordium_testnet");

    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
