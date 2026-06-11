import { createApi } from ".";
import { type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

// A base address (so it carries a stake credential and the live /v1/delegation query is actually
// issued) whose credentials are all-zeros: it is never delegated on-chain, so getStakes
// deterministically resolves to no staking position. Exercises the "account with no stake" path
// end-to-end through the public CoinModule surface.
const NO_STAKE_ADDRESS =
  "addr1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv2t5am";

describe("getStakes (integration)", () => {
  // Exercise the API surface (createApi), not the logic function directly.
  const api = createApi(config, "cardano");

  it("returns an empty page for an account with no staking position", async () => {
    const page = await api.getStakes(NO_STAKE_ADDRESS);
    expect(page.items).toEqual([]);
  }, 30000);
});
