import { setupTestnetCoinConfig } from "../../test/fixtures";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  it("returns last block info", async () => {
    const result = await lastBlock("concordium_testnet");

    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
