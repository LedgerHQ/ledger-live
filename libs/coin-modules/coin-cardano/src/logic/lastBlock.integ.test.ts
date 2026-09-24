import { lastBlock } from "./lastBlock";
import { mockCardanoConfig } from "../test/coinConfig";

describe("lastBlock (integration)", () => {
  it("fetches the current tip height from the Cardano API", async () => {
    const result = await lastBlock(mockCardanoConfig);

    expect(result.height).toBeGreaterThan(0);
    // The Ledger Cardano API exposes only the tip height, so hash is intentionally empty
    // and time is approximated as ~now. Asserted explicitly to document the limitation.
    expect(result.hash).toBe("");
    expect(result.time).toBeInstanceOf(Date);
  });
});
