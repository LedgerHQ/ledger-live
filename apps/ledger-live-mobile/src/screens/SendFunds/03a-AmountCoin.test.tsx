import React from "react";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1 } from "~/families/aleo/__mocks__/account.mock";
import SendAmountCoin from "./03a-AmountCoin";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({
    estimateMaxSpendable: jest.fn(() => Promise.resolve(new BigNumber(0))),
    updateTransaction: jest.fn((t: object, patch: object) => ({ ...t, ...patch })),
  })),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("~/screens/SendFunds/utils/customSendFlow", () => ({
  getCustomSendFlow: jest.fn(() => null),
}));

const mockGetCustomSendFlow = jest.mocked(getCustomSendFlow);
const mockUseAccountScreen = jest.mocked(useAccountScreen);
const mockUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const mockTransaction = {
  family: "aleo",
  recipient: "",
  useAllAmount: false,
  amount: new BigNumber(0),
};

function makeNavigation() {
  return {
    navigate: jest.fn(),
    getParent: jest.fn(),
  };
}

function makeRoute() {
  return {
    key: "amount-key",
    name: ScreenName.SendAmountCoin as const,
    params: { accountId: ALEO_ACCOUNT_1.id, transaction: mockTransaction },
  };
}

describe("SendAmountCoin — custom send flow", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();

  beforeEach(() => {
    mockGetCustomSendFlow.mockReturnValue(null);
    mockUseAccountScreen.mockReturnValue({ account: ALEO_ACCOUNT_1, parentAccount: null });
    mockUseBridgeTransaction.mockReturnValue({
      transaction: mockTransaction,
      setTransaction: jest.fn(),
      status: { errors: {}, warnings: {}, amount: new BigNumber(0) },
      bridgePending: false,
      bridgeError: null,
    } as never);

    mockNavigation.navigate.mockClear();
  });

  it("renders without AfterAmountInput when no custom flow", () => {
    render(<SendAmountCoin navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("amount-input")).toBeOnTheScreen();
  });

  it("renders AfterAmountInput when the family has a custom send flow", () => {
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      AfterAmountInput: () => <View testID="after-amount-input" />,
    });

    render(<SendAmountCoin navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(screen.getByTestId("after-amount-input")).toBeOnTheScreen();
  });

  it("resolves the custom send flow from the parent chain's family when sending a token", () => {
    mockUseAccountScreen.mockReturnValue({
      account: ALEO_TOKEN_ACCOUNT_1,
      parentAccount: ALEO_ACCOUNT_1,
    });
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      AfterAmountInput: () => <View testID="after-amount-input" />,
    });

    render(<SendAmountCoin navigation={mockNavigation as never} route={mockRoute as never} />);

    expect(mockGetCustomSendFlow).toHaveBeenCalledWith("aleo");
    expect(screen.getByTestId("after-amount-input")).toBeOnTheScreen();
  });
});
