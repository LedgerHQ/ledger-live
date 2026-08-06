import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from "./index";

const config = () => ({
  status: { type: "active" as const },
  infra: {
    API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
    API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
  },
});

describe("createApi (integration)", () => {
  let api: CoinModuleApi;

  beforeAll(() => {
    api = createApi(config);
  });

  describe("lastBlock", () => {
    it("returns the latest block with valid height, hash and time", async () => {
      const block = await api.lastBlock();

      expect(block.height).toBeGreaterThan(0);
      expect(typeof block.hash).toBe("string");
      expect((block.hash as string).length).toBeGreaterThan(0);

      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(block.time).toBeInstanceOf(Date);
      expect(block.time?.getTime()).toBeGreaterThan(Date.now() - oneDayMs);
      expect(block.time?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
