import { createApi } from "@ledgerhq/coin-cardano/api/index";
import { type CardanoConfig } from "@ledgerhq/coin-cardano/config";
import { initYaciIndexer } from "./yaciIndexer";

// getValidators reads /v1/pool/list + the epoch-params endpoint, neither of which Yaci provides — the
// adapter serves captured Ledger-proxy fixtures (see fixtures/ledgerPools.ts), so this is hermetic and
// needs no devnet. Exercises getValidators end-to-end through the CoinModule API on real-shaped data.
const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
// createApi() is context-driven (framework v6); the getValidators impl ignores the context, but the
// signature requires one. Derive its type from the api to avoid a direct coin-module-framework dep.
const context: Parameters<ReturnType<typeof createApi>["getValidators"]>[0] = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("getValidators (Yaci adapter, fixture-backed)", () => {
  let close: (() => void) | undefined;
  beforeAll(() => {
    close = initYaciIndexer();
  });
  afterAll(() => close?.());

  it("returns a non-empty page of well-formed validators", async () => {
    const page = await createApi("cardano_testnet").getValidators(context);

    expect(page.items.length).toBeGreaterThan(0);
    const v = page.items[0];
    expect(typeof v.address).toBe("string");
    expect(v.address.length).toBeGreaterThan(0);
    expect(typeof v.balance).toBe("bigint");
    expect(typeof v.commissionRate).toBe("string");
  });
});
