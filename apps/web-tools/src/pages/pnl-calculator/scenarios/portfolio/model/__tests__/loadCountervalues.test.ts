import { listen, type Log } from "@ledgerhq/logs";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { RateSource } from "@domain/api-market-countervalues";
import { loadPortfolioCountervalues } from "../loadCountervalues";

const rates: RateSource = {
  fetchHistorical: () => Promise.resolve({}),
  fetchLatest: pairs => Promise.resolve(pairs.map(() => 0)),
};

describe("loadPortfolioCountervalues", () => {
  it("reports the countervalues logs through @ledgerhq/logs, which web-tools listens to", async () => {
    const logs: Log[] = [];
    const unsubscribe = listen(entry => logs.push(entry));

    await loadPortfolioCountervalues([], getFiatCurrencyByTicker("USD"), rates);
    unsubscribe();

    expect(logs).toContainEqual(
      expect.objectContaining({ type: "countervalues", message: "0 updates to apply" }),
    );
  });
});
