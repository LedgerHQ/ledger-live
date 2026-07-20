import React from "react";
import { View, ScrollView } from "react-native";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { GasLessThanEstimate, NotEnoughGas } from "@ledgerhq/coin-evm/errors";
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
  estimatedFees: new BigNumber(1),
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

describe("SendSummary — status errors", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();

  beforeEach(() => {
    mockGetCustomSendFlow.mockReturnValue(null);
    mockUseAccountScreen.mockReturnValue({ account: ALEO_ACCOUNT_1, parentAccount: null });
  });

  function mockStatusWithErrors(errors: Record<string, Error>) {
    mockUseBridgeTransaction.mockReturnValue({
      transaction: { family: "aleo", recipient: "aleo1abc", useAllAmount: false },
      setTransaction: jest.fn(),
      status: { ...mockStatus, errors },
      bridgePending: false,
      bridgeError: null,
    } as never);
  }

  it("disables Continue and shows the fee message when gas estimation failed (FeeNotLoaded)", () => {
    // A FeeNotLoaded error on gasLimit must block the CTA and be visible to the user.
    mockStatusWithErrors({ gasLimit: new FeeNotLoaded() });

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("disabled-summary-continue-button")).toBeOnTheScreen();
    expect(screen.getByText("Could not load fee rates")).toBeOnTheScreen();
  });

  it("disables Continue and shows the balance message when funds are insufficient", () => {
    mockStatusWithErrors({ amount: new NotEnoughBalance() });

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("disabled-summary-continue-button")).toBeOnTheScreen();
    expect(screen.getByText("Sorry, insufficient funds")).toBeOnTheScreen();
  });

  it("keeps Continue enabled and shows no error message when there are no errors", () => {
    mockStatusWithErrors({});

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("enabled-summary-continue-button")).toBeOnTheScreen();
    expect(screen.queryByText("Could not load fee rates")).not.toBeOnTheScreen();
  });

  it("disables Continue when the native balance can't cover gas (NotEnoughGas on gasPrice)", () => {
    mockStatusWithErrors({ gasPrice: new NotEnoughGas() });

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("disabled-summary-continue-button")).toBeOnTheScreen();
  });

  it("disables Continue when the blocking error is not the first key (ordering slip-through)", () => {
    const errors = { gasLimit: new GasLessThanEstimate(), gasPrice: new NotEnoughGas() };

    const firstError = errors[Object.keys(errors)[0] as keyof typeof errors];
    expect(firstError instanceof NotEnoughGas || firstError instanceof NotEnoughBalance).toBe(
      false,
    );

    mockStatusWithErrors(errors);

    render(<SendSummary navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("disabled-summary-continue-button")).toBeOnTheScreen();
  });
});
