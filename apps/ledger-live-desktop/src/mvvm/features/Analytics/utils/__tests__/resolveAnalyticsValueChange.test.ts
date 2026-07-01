import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { resolveAnalyticsValueChange } from "../resolveAnalyticsValueChange";
import { defaultPortfolio, mockCounterValue } from "LLD/hooks/__tests__/fixtures";

const mockCvState = { data: {}, status: {}, cache: {} } as CounterValuesState;

describe("resolveAnalyticsValueChange", () => {
  it("uses the selected portfolio range change for non-all ranges", () => {
    const portfolio = {
      ...defaultPortfolio,
      countervalueChange: { percentage: 0.12, value: 120 },
    };

    const result = resolveAnalyticsValueChange({
      selectedTimeRange: "week",
      accounts: [],
      currentBalance: 1000,
      portfolio,
      cvState: mockCvState,
      counterValue: mockCounterValue,
    });

    expect(result).toEqual(portfolio.countervalueChange);
  });

  it("uses the first receive baseline for the all-time range", () => {
    const portfolio = {
      ...defaultPortfolio,
      countervalueChange: { percentage: 0.5, value: 500 },
    };

    const result = resolveAnalyticsValueChange({
      selectedTimeRange: "all",
      accounts: [],
      currentBalance: 1000,
      portfolio,
      cvState: mockCvState,
      counterValue: mockCounterValue,
    });

    expect(result).toEqual({ value: 0, percentage: null });
  });
});
