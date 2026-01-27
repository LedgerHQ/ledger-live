/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, Text } from "react-native";
import { render } from "@testing-library/react-native";
import StepFinish from "../StepFinish";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/native-ui", () => {
  const mockViewComponentFn = ({ children, testID, ...props }: any) =>
    React.createElement(View, { testID, ...props }, children);
  return {
    Flex: mockViewComponentFn,
    Text: ({ children, testID, ...props }: any) =>
      React.createElement(Text, { testID, ...props }, children),
    IconBox: ({ Icon: _Icon, testID, ...props }: any) =>
      React.createElement(View, { testID: testID || "icon-box", ...props }, "Icon"),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) => {
      if (params?.count !== undefined) {
        return `${key} (${params.count})`;
      }
      return key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement(Text, {}, i18nKey),
}));

jest.mock("~/icons/Ledger", () => ({
  __esModule: true,
  default: () => React.createElement(View, {}, React.createElement(Text, {}, "LedgerIcon")),
}));

const mockCurrency = {
  id: "canton_network",
  family: "canton",
} as unknown as CryptoCurrency;

const mockAccount = {
  type: "Account" as const,
  id: "account-1",
} as unknown as Account;

describe("StepFinish", () => {
  const defaultProps = {
    currency: mockCurrency,
    device: { deviceId: "device-1" },
    accountName: "Test Account",
    editedNames: {},
    creatableAccount: mockAccount,
    importableAccounts: [],
    onboardingConfig: undefined,
    isReonboarding: false,
    onboardingStatus: AccountOnboardStatus.SUCCESS,
    isProcessing: false,
    error: null,
    onboardingResult: undefined,
    onAddAccounts: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetryOnboardAccount: jest.fn(),
    transitionTo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success icon", () => {
    const { getByTestId } = render(<StepFinish {...defaultProps} />);
    expect(getByTestId("icon-box")).toBeDefined();
  });

  it("should display success message for normal onboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} />);
    expect(getByText("addAccounts.success (0)")).toBeDefined();
  });

  it("should display reonboard success message for reonboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} isReonboarding={true} />);
    expect(getByText("canton.onboard.reonboard.success")).toBeDefined();
  });

  it("should include completed account in count", () => {
    const completedAccount = { ...mockAccount, id: "account-completed" };
    const { getByText } = render(
      <StepFinish
        {...defaultProps}
        importableAccounts={[mockAccount]}
        onboardingResult={{ completedAccount }}
      />,
    );
    expect(getByText("addAccounts.success (2)")).toBeDefined();
  });

  it("should display success description", () => {
    const { getByText } = render(<StepFinish {...defaultProps} />);
    expect(getByText("addAccounts.successDescription (0)")).toBeDefined();
  });

  it("should display reonboard success description for reonboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} isReonboarding={true} />);
    expect(getByText("canton.onboard.reonboard.successDescription")).toBeDefined();
  });
});
