/**
 * @jest-environment node
 */
import BigNumber from "bignumber.js";
import { buildCV, dailyHistory } from "@domain/entity-market-countervalues/mock";
import { buy, ETH, makeAccount, USD } from "@ledgerhq/wallet-pnl/scenarios";

// The module registers the lookup as it loads. Loading it in an isolated registry, where the global
// jest setup has registered nothing, makes the test fail if it ever stops doing so.
describe("live-common-setup", () => {
  it("registers a rate lookup that prices a position when it loads", () => {
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

    jest.isolateModules(() => {
      const pnl = require("@ledgerhq/wallet-pnl") as typeof import("@ledgerhq/wallet-pnl");
      expect(() => pnl.computeAssetPnL(account, countervalues, USD)).toThrow(
        /Rate lookup is not set/,
      );

      require("./live-common-setup");

      const result = pnl.computeAssetPnL(account, countervalues, USD);
      // 10 ETH bought at 2000 USD, now at 2400 USD, in cents
      expect(result?.costBasis.toFixed()).toBe("2000000");
      expect(result?.unrealisedPnL.toFixed()).toBe("400000");
    });
  });
});
