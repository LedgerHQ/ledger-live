import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import nock from "nock";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { StellarMemo } from "../types";
import { createApi } from ".";

describe("Stellar Api", () => {
  let module: CoinModuleApi<StellarMemo>;
  const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

  beforeAll(() => {
    nock("https://horizon-testnet.stellar.org")
      .get(/.*/)
      .reply(() => {
        return [429, { error: "whatever, only status code is important" }];
      });

    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
      },
    });
  });

  describe("listOperations propagates 429 errors to caller", () => {
    it("throws LedgerAPI4xx on rate limit", async () => {
      await expect(
        module.listOperations(ADDRESS, { minHeight: 0, order: "asc" }),
      ).rejects.toThrow(LedgerAPI4xx);
    });
  });
});
