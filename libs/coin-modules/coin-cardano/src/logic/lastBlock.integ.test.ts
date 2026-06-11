import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  it("fetches the current tip height from the Cardano API", async () => {
    const currency = getCryptoCurrencyById("cardano");

    const result = await lastBlock(currency);

    expect(result.height).toBeGreaterThan(0);
    // The Ledger Cardano API exposes only the tip height, so hash is intentionally empty
    // and time is approximated as ~now. Asserted explicitly to document the limitation.
    expect(result.hash).toBe("");
    expect(result.time).toBeInstanceOf(Date);
  });
});
