import { useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import type { FiatCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getPortfolio } from "@ledgerhq/live-countervalues/portfolio";
import { usePortfolioThrottled } from "./portfolio";

jest.mock(".", () => {
  const state = { data: {}, status: {}, cache: {} };
  return { useCountervaluesState: jest.fn(() => state) };
});

jest.mock("@ledgerhq/live-hooks/useThrottledFunction", () => ({
  useThrottledValues: (values: unknown[]) => {
    const React = jest.requireActual<typeof import("react")>("react");
    return React.useMemo(() => values, [values[0], values[1]]);
  },
}));

jest.mock("@ledgerhq/live-countervalues/portfolio", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/portfolio"),
  getPortfolio: jest.fn(),
}));

const usd: FiatCurrency = {
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "dollar", code: "USD", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

const eur: FiatCurrency = {
  type: "FiatCurrency",
  name: "Euro",
  ticker: "EUR",
  symbol: "€",
  units: [{ name: "euro", code: "EUR", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

const mockGetPortfolio = jest.mocked(getPortfolio);
const accounts: never[] = [];

describe("usePortfolioThrottled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPortfolio.mockImplementation((_accounts, _range, _state, to) => ({
      balanceHistory: [{ date: new Date(), value: to === usd ? 100 : 90 }],
      balanceAvailable: true,
      countervalueComplete: true,
      availableAccounts: [],
      unavailableCurrencies: [],
      accounts: [],
      range: "day",
      histories: [],
      countervalueReceiveSum: 0,
      countervalueSendSum: 0,
      countervalueChange: { value: 0, percentage: 0 },
    }));
  });

  it("never exposes the previous fiat portfolio under the new currency", () => {
    const observed: string[] = [];
    const { rerender } = renderHook(
      ({ to }: { to: FiatCurrency }) => {
        const portfolio = usePortfolioThrottled({ accounts, range: "day", to });
        const value = portfolio.balanceHistory.at(-1)?.value;
        useEffect(() => {
          observed.push(`${to.ticker}:${value}`);
        }, [to, value]);
        return portfolio;
      },
      { initialProps: { to: usd } },
    );

    act(() => rerender({ to: eur }));

    expect(observed).toContain("USD:100");
    expect(observed).toContain("EUR:90");
    expect(observed).not.toContain("EUR:100");
  });
});
