import BigNumber from "bignumber.js";
import { buildCV, dailyHistory } from "@domain/entity-market-countervalues/mock";
import { computeAssetPnL, invalidatePnLCache, resetRateLookup } from "@ledgerhq/wallet-pnl";
import { buy, ETH, makeAccount, USD } from "@ledgerhq/wallet-pnl/scenarios";
import { setupRateLookups } from "./bridge-setup";

// The global jest setup registers a lookup before every test, which would hide this function
// no longer registering one, so each test starts from an empty registry.
describe("setupRateLookups", () => {
  const buyDate = new Date(Date.UTC(2025, 0, 15));
  const unit = new BigNumber(10).pow(ETH.units[0].magnitude);
  const account = makeAccount(ETH, {
    operations: [buy(unit.times(10), buyDate)],
    balance: unit.times(10),
  });
  const countervalues = buildCV({
    pair: { from: ETH, to: USD },
    history: dailyHistory([[buyDate, 2000]]),
    latest: 2400,
  });

  beforeEach(() => {
    resetRateLookup();
    invalidatePnLCache();
  });

  it("starts from an empty registry", () => {
    expect(() => computeAssetPnL(account, countervalues, USD)).toThrow(/Rate lookup is not set/);
  });

  it("registers a lookup that prices a position", () => {
    setupRateLookups();

    const pnl = computeAssetPnL(account, countervalues, USD);

    // 10 ETH bought at 2000 USD, now at 2400 USD, in cents
    expect(pnl?.costBasis.toFixed()).toBe("2000000");
    expect(pnl?.unrealisedPnL.toFixed()).toBe("400000");
  });
});
