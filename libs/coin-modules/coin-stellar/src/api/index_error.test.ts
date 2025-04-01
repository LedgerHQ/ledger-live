import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import { StellarToken } from "../types";
import nock from "nock";
/**
 * Testnet scan: https://testnet.lumenscan.io/
 *
 * Tests are skipped for the moment due to TooManyRequest errors
 */
describe("Stellar Api", () => {
  let module: Api<StellarToken>;
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
      const [txs] = await module.listOperations(ADDRESS, { minHeight: 0 });
      expect(txs.length).toBe(0);
    });
  });
});
