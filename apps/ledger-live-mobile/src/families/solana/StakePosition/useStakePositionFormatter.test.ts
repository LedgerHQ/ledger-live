import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { importCountervalues, pairId } from "@domain/entity-market-countervalues";
import { countervaluesTestUserSettings, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useStakePositionFormatter } from "./useStakePositionFormatter";

const solana = getCryptoCurrencyById("solana");
const usd = getFiatCurrencyByTicker("USD");
const account = genAccount("stake-position-formatter", { currency: solana, operationsSize: 0 });
const ONE_SOL = "1000000000";

function renderFormatter({ hasSolRate = true, discreet = false } = {}) {
  const { result, unmount } = renderHook(() => useStakePositionFormatter(account), {
    overrideInitialState: (state: State): State => ({
      ...state,
      settings: { ...state.settings, discreetMode: discreet },
      countervalues: hasSolRate
        ? {
            ...state.countervalues,
            rates: importCountervalues(
              { status: {}, [pairId({ from: solana, to: usd })]: { latest: 150 } },
              countervaluesTestUserSettings,
            ),
          }
        : state.countervalues,
    }),
  });
  const format = result.current;
  unmount();
  return format;
}

describe("useStakePositionFormatter", () => {
  it("should format base units in the account unit, with their counter value", () => {
    expect(renderFormatter().amount("1500000000")).toEqual({
      crypto: "1.5\u00a0SOL",
      fiat: "$225.00",
    });
  });

  it("should build the rewards headline from the counter value", () => {
    const headline = renderFormatter().rewardsHeadline(ONE_SOL);

    expect(headline).toMatchObject({ hidden: false });
    expect(JSON.stringify(headline?.formatter(headline.value))).toContain("150");
  });

  it("should give no counter value without a rate", () => {
    const format = renderFormatter({ hasSolRate: false });

    expect(format.amount(ONE_SOL)).toEqual({ crypto: "1\u00a0SOL", fiat: undefined });
    expect(format.rewardsHeadline(ONE_SOL)).toBeUndefined();
  });

  it("should mask the amounts in discreet mode", () => {
    const format = renderFormatter({ discreet: true });

    expect(format.amount("1500000000").crypto).toMatch(/\*\*\*/);
    expect(format.amount("1500000000").crypto).not.toContain("1.5");
    expect(format.rewardsHeadline(ONE_SOL)?.hidden).toBe(true);
  });

  it.each([
    ["rounds to two decimals", 0.078107, "7.81%"],
    ["rounds up", 0.07129, "7.13%"],
    ["keeps a rate that has two decimals", 0.0712, "7.12%"],
    ["pads a rate with one decimal", 0.065, "6.50%"],
    ["pads a whole rate", 0.07, "7.00%"],
    ["shows a zero rate", 0, "0.00%"],
    ["shows the upper bound of a fraction", 1, "100.00%"],
  ])(
    "should show a fraction as a percentage with two decimals: %s",
    (_case, fraction, expected) => {
      expect(renderFormatter().percent(fraction)).toBe(expected);
    },
  );
});
