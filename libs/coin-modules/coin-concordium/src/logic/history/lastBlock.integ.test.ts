import { concordiumDefaults } from "../../config";
import { lastBlock } from "./lastBlock";
import { createFixtureContext } from "../../test/fixtures";

describe("lastBlock", () => {
  const context = createFixtureContext(concordiumDefaults.concordium_testnet);

  it("returns last block info", async () => {
    const result = await lastBlock(context);

    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
