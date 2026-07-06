import React from "react";
import { View, ScrollView } from "react-native";
import { BigNumber } from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { ALEO_ACCOUNT_1 } from "~/families/aleo/__mocks__/account.mock";
import SendSummary from "./04-Summary";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("~/logic/screenTransactionHooks", () => ({
  useTransactionChangeFromNavigation: jest.fn(),
}));

jest.mock("~/screens/SendFunds/utils/customSendFlow", () => ({
  getCustomSendFlow: jest.fn(() => null),
}));

jest.mock("~/components/SafeAreaView", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
}));

jest.mock("~/components/NavigationScrollView", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <ScrollView>{children}</ScrollView>,
}));

const mockGetCustomSendFlow = jest.mocked(getCustomSendFlow);
const mockUseAccountScreen = jest.mocked(useAccountScreen);
const mockUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const mockStatus = {
  errors: {},
  warnings: {},
  amount: new BigNumber(100),
  totalSpent: new BigNumber(100),
};

function makeNavigation() {
  return {
    navigate: jest.fn(),
    getParent: jest.fn(() => null),
    setOptions: jest.fn(),
  };
}

function makeRoute(transactionOverride = {}) {
  return {
    key: "summary-key",
    name: ScreenName.SendSummary as const,
    params: {
      accountId: ALEO_ACCOUNT_1.id,
      transaction: {
        family: "aleo",
        recipient: "aleo1abc",
        useAllAmount: false,
        ...transactionOverride,
      },
      nextNavigation: null,
      overrideAmountLabel: undefined,
      hideTotal: false,
    },
  };
}

describe("SendSummary — custom send flow", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();

  beforeEach(() => {
    mockGetCustomSendFlow.mockReturnValue(null);
    mockUseAccountScreen.mockReturnValue({ account: ALEO_ACCOUNT_1, parentAccount: null });
    mockUseBridgeTransaction.mockReturnValue({
      transaction: { family: "aleo", recipient: "aleo1abc", useAllAmount: false },
      setTransaction: jest.fn(),
      status: mockStatus,
      bridgePending: false,
      bridgeError: null,
    } as never);
  });

  it("renders correctly with no custom flow", () => {
    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("enabled-summary-continue-button")).toBeOnTheScreen();
  });

  it("renders custom SummaryToSection when family has a custom flow", () => {
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      SummaryToSection: () => <View testID="custom-summary-to" />,
    });

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("custom-summary-to")).toBeOnTheScreen();
  });

  it("skips the recipient section when transaction has no recipient", () => {
    const mockRouteWithNoRecipient = makeRoute({ recipient: "" });

    mockUseBridgeTransaction.mockReturnValue({
      transaction: { family: "aleo", recipient: "", useAllAmount: false },
      setTransaction: jest.fn(),
      status: mockStatus,
      bridgePending: false,
      bridgeError: null,
    } as never);

    render(
      <SendSummary
        navigation={mockNavigation as never}
        route={mockRouteWithNoRecipient as never}
      />,
    );

    expect(screen.getByTestId("enabled-summary-continue-button")).toBeOnTheScreen();
  });
});
