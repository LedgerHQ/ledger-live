import { AccountAssetBalanceSchema } from "@domain/entity-account-balance";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { accountAssetRows } from "./accountAssetRows";

const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");

const countervalues = buildCV({
  pair: { from: ethereum, to: usd },
  history: { "2026-01-14": 2000, "2026-01-15": 2000 },
  latest: 2200,
});

const row = (assetId: string, balance: string) =>
  AccountAssetBalanceSchema.parse({ assetId, balance, spendableBalance: balance });

const now = new Date("2026-01-15T12:00:00Z");

describe("accountAssetRows", () => {
  it("values each asset at the latest rate, and its trend over the last 24 hours", () => {
    const [eth] = accountAssetRows(
      [row("ethereum", "1500000000000000000")],
      countervalues,
      () => ethereum,
      usd,
      now,
    );
    expect(eth.value).toBe(330000);
    expect(eth.trend).toBeCloseTo(0.1);
  });

  it("keeps the crypto row as is without a rate or a currency", () => {
    const token = row("ethereum/erc20/usd__coin", "5");
    expect(accountAssetRows([token], countervalues, () => undefined, usd, now)).toEqual([token]);
    const btc = getCryptoCurrencyById("bitcoin");
    const [unpriced] = accountAssetRows([row("bitcoin", "1")], countervalues, () => btc, usd, now);
    expect(unpriced.value).toBeUndefined();
    expect(unpriced.trend).toBeUndefined();
  });
});
