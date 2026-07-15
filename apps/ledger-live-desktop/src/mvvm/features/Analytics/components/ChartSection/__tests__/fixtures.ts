import { withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { defaultPortfolio, mockCounterValue } from "LLD/hooks/__tests__/fixtures";

export const portfolioWithHistory = {
  ...defaultPortfolio,
  balanceHistory: [
    { date: new Date("2026-01-01T00:00:00.000Z"), value: 1000 },
    { date: new Date("2026-01-02T00:00:00.000Z"), value: 1200 },
  ],
  balanceAvailable: true,
  countervalueChange: { percentage: 0.2, value: 200 },
};

export const chartSectionInitialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
  },
};

export const chartSectionHeaderInitialState = {
  ...chartSectionInitialState,
  ...withFlagOverrides({
    lwdWallet40: { enabled: true },
  }),
};
