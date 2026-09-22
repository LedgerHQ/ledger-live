import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { resolveAnalyticsValueChange } from "../resolveAnalyticsValueChange";
import { resetRateLookup, setRateLookup } from "../rateLookup";

const mockCounterValue = getFiatCurrencyByTicker("USD");
const mockCvState = { data: {}, status: {}, cache: {} };

const defaultPortfolio = {
  balanceHistory: [],
  countervalueChange: { percentage: 0.12, value: 120 },
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "week" as const,
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
};

describe("resolveAnalyticsValueChange", () => {
  beforeEach(() => {
    setRateLookup({ calculate: () => undefined });
  });

  afterAll(() => {
    resetRateLookup();
  });

  it("uses the selected portfolio range change for non-all ranges", () => {
    const result = resolveAnalyticsValueChange({
      selectedTimeRange: "week",
      accounts: [],
      currentBalance: 1000,
      portfolio: defaultPortfolio,
      cvState: mockCvState,
      counterValue: mockCounterValue,
    });

    expect(result).toEqual(defaultPortfolio.countervalueChange);
  });

  it("uses the first receive baseline for the all-time range", () => {
    const result = resolveAnalyticsValueChange({
      selectedTimeRange: "all",
      accounts: [],
      currentBalance: 1000,
      portfolio: defaultPortfolio,
      cvState: mockCvState,
      counterValue: mockCounterValue,
    });

    expect(result).toEqual({ value: 0, percentage: null });
  });
});
