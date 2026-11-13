import type { BitcoinContext } from "../../config";
import { getBalance } from "../getBalance";
import { listHoldings } from "../listHoldings";
import { EMPTIED_P2WPKH, FUNDED_P2WPKH } from "./helpers/fixtures";

const liveContext: BitcoinContext = {
  config: async currencyId => ({
    status: { type: "active" },
    name: currencyId ?? "bitcoin",
    unit: { name: "unit", code: "UNIT", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

describe("listHoldings (live explorer)", () => {
  it("lists the funded address's outputs, which add up to its balance", async () => {
    const holdings = [];
    let cursor: string | undefined;
    do {
      const page = await listHoldings(liveContext, "bitcoin", FUNDED_P2WPKH, {
        ...(cursor ? { cursor } : {}),
      });
      holdings.push(...page.items);
      cursor = page.next;
    } while (cursor);

    expect(holdings.length).toBeGreaterThan(0);
    for (const holding of holdings) {
      expect(holding.id).toMatch(/^[0-9a-f]{64}:\d+$/);
      expect(holding.asset).toEqual({ type: "native" });
      expect(holding.value).toBeGreaterThan(0n);
    }
    // Holds only with nothing pending: getBalance counts confirmed funds, holdings also own change.
    const [balance] = await getBalance(liveContext, "bitcoin", FUNDED_P2WPKH);
    expect(holdings.reduce((sum, holding) => sum + holding.value, 0n)).toBe(balance.value);
  });

  it("lists nothing for the used then emptied address", async () => {
    expect(await listHoldings(liveContext, "bitcoin", EMPTIED_P2WPKH)).toEqual({ items: [] });
  });
});
