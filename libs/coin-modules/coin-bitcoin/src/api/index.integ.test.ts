// The craft and combine flow is not implemented yet; it gets its integration tests with it.
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../config";
import { FUNDED_P2WPKH, KNOWN_BLOCK } from "../logic/tests/helpers/fixtures";
import { createApi } from "./index";

const liveContext: BitcoinContext = {
  config: async () => ({
    status: { type: "active" },
    name: "Bitcoin",
    unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

describe("createApi (live explorer)", () => {
  const api = withDefaults(createApi("bitcoin"));

  it("returns the tip", async () => {
    const info = await api.lastBlock(liveContext);
    expect(info.height).toBeGreaterThan(KNOWN_BLOCK.height);
    expect(info.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns the known block info", async () => {
    const info = await api.getBlockInfo(liveContext, KNOWN_BLOCK.height);
    expect(info.hash).toBe(KNOWN_BLOCK.hash);
  });

  it("returns the balance of the funded address", async () => {
    const [balance] = await api.getBalance(liveContext, FUNDED_P2WPKH);
    expect(balance.value).toBeGreaterThan(0n);
  });
});
