import React from "react";
import { render, screen } from "tests/testSetup";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import AccountBalanceSummary from "./BalanceSummary";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

jest.mock("~/renderer/actions/portfolio", () => ({
  useBalanceHistoryWithCountervalue: jest.fn(() => ({
    history: [{ date: new Date("2024-01-01"), value: 100, countervalue: 50 }],
    countervalueAvailable: false,
    countervalueChange: { percentage: 0, value: 0 },
    cryptoChange: { percentage: 0, value: 0 },
  })),
  usePortfolio: jest.fn(() => ({
    balanceHistory: [],
    countervalueChange: { percentage: 0, value: 0 },
    range: "month",
  })),
}));

jest.mock("~/renderer/actions/settings", () => ({
  useTimeRange: jest.fn(() => ["month", jest.fn()]),
  counterValueCurrencySelector: jest.fn(),
  discreetModeSelector: jest.fn(),
}));

jest.mock("~/renderer/components/Chart", () => ({
  __esModule: true,
  GraphTrackingScreenName: { Account: "Account" },
  default: jest.fn(() => <div data-testid="chart" />),
}));

jest.mock("~/renderer/screens/account/AccountBalanceSummaryHeader", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="balance-summary-header" />),
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({ magnitude: 8, name: "Bitcoin", code: "BTC" })),
}));

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  useDateFormatter: jest.fn(() => (date: Date) => date.toISOString()),
  dayFormat: "day",
  hourFormat: "hour",
}));

const mockCurrency = { family: "bitcoin", units: [{ magnitude: 8, name: "Bitcoin", code: "BTC" }] };
const mockAccount: AccountLike = {
  type: "Account",
  id: "mock-account-id",
  currency: mockCurrency,
} as unknown as AccountLike;

const mockMainAccount: Account = {
  type: "Account",
  id: "mock-main-account-id",
  currency: mockCurrency,
} as unknown as Account;

const baseProps = {
  account: mockAccount,
  parentAccount: null,
  countervalueFirst: false,
  chartColor: "#000000",
  setCountervalueFirst: jest.fn(),
  mainAccount: mockMainAccount,
};

beforeEach(() => jest.clearAllMocks());

describe("AccountBalanceSummary — AccountBalanceSummaryFooter family slot", () => {
  it("should render the family footer when provided", () => {
    mockFamily.mockReturnValue({
      AccountBalanceSummaryFooter: () => <div data-testid="footer" />,
    } as never);

    render(<AccountBalanceSummary {...baseProps} />);

    expect(screen.getByTestId("footer")).toBeVisible();
  });

  it("should not render any footer when the family provides none", () => {
    mockFamily.mockReturnValue({} as never);

    render(<AccountBalanceSummary {...baseProps} />);

    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });
});
