import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import nock from "nock";
import { StellarMemo } from "../types";
import { createApi } from ".";
describe("Stellar Api", () => {
  let module: AlpacaApi<StellarMemo>;
  const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

  beforeAll(() => {
    nock("https://horizon-testnet.stellar.org")
      .get(/.*/)
      .reply(() => {
        return [429, { error: "whatever, only status code is important" }];
      })
      .get(/.*/)
      .reply(() => {
        return [200, { _links: {}, _embedded: { records: [] } }];
      });

    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
      },
    });
  });

  describe("listOperations can handle 429 errors", () => {
    it("retrieved operations", async () => {
      const { items: txs } = await module.listOperations(ADDRESS, { minHeight: 0, order: "asc" });
      expect(txs.length).toBe(0);
    });
  });
});
