import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "@tests/test-renderer";
import UnstakeAmount from "../01-Amount";
import { ScreenName } from "~/const";

const mockNavigate = jest.fn();
const mockSetTransaction = jest.fn();
const mockTransaction = {
  family: "tezos",
  mode: "unstake",
  amount: new BigNumber(0),
  useAllAmount: false,
};
let mockStatus: {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  amount: BigNumber;
  estimatedFees?: BigNumber;
};
let mockBridgeError: Error | null = null;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { accountId: "tezos-acc-1" } }),
}));
jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({
    account: { id: "tezos-acc-1", type: "Account" },
    parentAccount: null,
  }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", magnitude: 6, name: "tezos" }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => mockTransaction,
    updateTransaction: (t: object, patch: object) => ({ ...t, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: mockTransaction,
    setTransaction: mockSetTransaction,
    status: mockStatus,
    bridgePending: false,
    bridgeError: mockBridgeError,
  }),
}));
jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => ({ stakedBalance: new BigNumber(5000000) }),
}));
jest.mock("~/screens/SendFunds/AmountInput", () => {
  const { View } = jest.requireActual("react-native");
  return ({ error }: { error?: Error | null }) => (
    <View testID="amount-input">{error ? <View testID="amount-input-error" /> : null}</View>
  );
});
jest.mock("~/components/Alert", () => () => null);
jest.mock("~/components/GenericErrorBottomModal", () => {
  const { View } = jest.requireActual("react-native");
  return ({ error }: { error?: Error | null }) =>
    error ? <View testID="bridge-error-modal" /> : null;
});
jest.mock("~/components/CurrencyUnitValue", () => () => null);
jest.mock("~/components/KeyboardView", () => {
  const { View } = jest.requireActual("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});
jest.mock("~/analytics", () => ({ TrackScreen: () => null }));
jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (k: string) => k }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});
jest.mock("~/components/Button", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({
    onPress,
    title,
    testID,
    disabled,
  }: {
    onPress: () => void;
    title?: React.ReactNode;
    testID?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity testID={testID} onPress={disabled ? undefined : onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

describe("Tezos UnstakeFlow Amount", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetTransaction.mockClear();
    mockBridgeError = null;
    mockStatus = {
      errors: {},
      warnings: {},
      amount: new BigNumber(0),
      estimatedFees: new BigNumber(1000),
    };
  });

  it("continues to the device step once the amount is ready", async () => {
    render(<UnstakeAmount />);
    fireEvent.press(await screen.findByTestId("tezos-unstake-amount-continue"));
    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.TezosUnstakeSelectDevice,
      expect.objectContaining({
        accountId: "tezos-acc-1",
        transaction: mockTransaction,
        status: mockStatus,
      }),
    );
  });

  it("surfaces a bridge error", async () => {
    mockBridgeError = new Error("prepare failed");
    render(<UnstakeAmount />);
    expect(await screen.findByTestId("bridge-error-modal")).toBeTruthy();
  });

  it("forwards the amount error to the input once an amount is entered", async () => {
    mockStatus = {
      errors: { amount: new Error("amount too high") },
      warnings: {},
      amount: new BigNumber(100),
    };
    render(<UnstakeAmount />);
    expect(await screen.findByTestId("amount-input-error")).toBeTruthy();
  });

  it("suppresses the amount error while the field is still empty", async () => {
    mockStatus = {
      errors: { amount: new Error("amount too high") },
      warnings: {},
      amount: new BigNumber(0),
    };
    render(<UnstakeAmount />);
    await screen.findByTestId("amount-input");
    expect(screen.queryByTestId("amount-input-error")).toBeNull();
  });

  it("shows the staked balance as the available amount", async () => {
    render(<UnstakeAmount />);
    expect(await screen.findByText("tezos.unstake.flow.amount.staked")).toBeTruthy();
  });

  it("shows the estimated network fee once loaded", async () => {
    render(<UnstakeAmount />);
    expect(await screen.findByText("send.fees.title")).toBeTruthy();
  });
});
