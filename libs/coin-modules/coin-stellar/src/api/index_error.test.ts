import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { Horizon } from "@stellar/stellar-sdk";
import { StellarMemo } from "../types";
import { createApi } from ".";

/**
 * Minimal chainable stub of a Horizon call builder: every builder method returns
 * the builder itself, and `call()` rejects with the configured error.
 */
function rejectingBuilder(error: unknown): unknown {
  const builder: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "call") return () => Promise.reject(error);
        return () => builder;
      },
    },
  );
  return builder;
}

describe("Stellar Api", () => {
  let module: CoinModuleApi<StellarMemo>;
  const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("listOperations propagates 429 errors to caller", () => {
    it("throws LedgerAPI4xx on rate limit", async () => {
      // Horizon surfaces a 429 as a NetworkError whose message is the "Too Many Requests"
      // status text, which fetchOperations maps to the rate-limit-specific LedgerAPI4xx.
      jest
        .spyOn(Horizon.Server.prototype, "operations")
        .mockReturnValue(rejectingBuilder(new Error("Too Many Requests")) as never);

      await expect(
        module.listOperations(ADDRESS, { minHeight: 0, order: "asc" }),
      ).rejects.toMatchObject({ name: "LedgerAPI4xx", status: 429 });
    });
  });
});
