import { createApi } from "@ledgerhq/coin-cardano/api/index";
import { type CardanoConfig } from "@ledgerhq/coin-cardano/config";
import { initYaciIndexer } from "./yaciIndexer";

// getValidators reads /v1/pool/list + the epoch-params endpoint, neither of which Yaci provides — the
// adapter serves captured Ledger-proxy fixtures (see fixtures/ledgerPools.ts), so this is hermetic and
// needs no devnet. Exercises getValidators end-to-end through the CoinModule API on real-shaped data.
const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("getValidators (Yaci adapter, fixture-backed)", () => {
  let close: (() => void) | undefined;
  beforeAll(() => {
    close = initYaciIndexer();
  });
  afterAll(() => close?.());

  it("returns a non-empty page of well-formed validators", async () => {
    const page = await createApi(config, "cardano_testnet").getValidators();

    expect(page.items.length).toBeGreaterThan(0);
    const v = page.items[0];
    expect(typeof v.address).toBe("string");
    expect(v.address.length).toBeGreaterThan(0);
    expect(typeof v.balance).toBe("bigint");
    expect(typeof v.commissionRate).toBe("string");
  });
});
