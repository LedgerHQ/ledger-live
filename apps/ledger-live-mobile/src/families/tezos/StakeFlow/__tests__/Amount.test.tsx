import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "@tests/test-renderer";
import StakeAmount from "../01-Amount";
import { ScreenName } from "~/const";
import { AWAIT_DELEGATION_POLL_INTERVAL_MS, MAX_AWAIT_DELEGATION_POLLS } from "../constants";

const mockNavigate = jest.fn();
const mockSetTransaction = jest.fn();
const mockTransaction = {
  family: "tezos",
  mode: "stake",
  amount: new BigNumber(0),
  useAllAmount: false,
};
const mockMaxSpendable = new BigNumber(6052734);
let mockStatus: {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  amount: BigNumber;
  estimatedFees?: BigNumber;
};
let mockAwaiting = false;
const mockSyncDispatch = jest.fn();
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
    estimateMaxSpendable: () => Promise.resolve(mockMaxSpendable),
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
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockSyncDispatch,
}));
jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useDelegation: () => ({ isPending: false }),
  isAwaitingDelegation: () => mockAwaiting,
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

describe("Tezos StakeFlow Amount", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetTransaction.mockClear();
    mockSyncDispatch.mockClear();
    mockAwaiting = false;
    mockBridgeError = null;
    mockStatus = {
      errors: {},
      warnings: {},
      amount: new BigNumber(0),
      estimatedFees: new BigNumber(1000),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the awaiting-delegation state instead of the amount form while the delegation propagates", async () => {
    mockAwaiting = true;
    render(<StakeAmount />);
    expect(await screen.findByText("tezos.stake.flow.amount.awaitingDelegation")).toBeTruthy();
    expect(screen.queryByTestId("tezos-stake-amount-continue")).toBeNull();
  });

  it("continues to the device step once the amount is ready", async () => {
    render(<StakeAmount />);
    fireEvent.press(await screen.findByTestId("tezos-stake-amount-continue"));
    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.TezosStakeSelectDevice,
      expect.objectContaining({
        accountId: "tezos-acc-1",
        transaction: mockTransaction,
        status: mockStatus,
      }),
    );
  });

  it("polls then stops and reveals the amount form after the await-delegation timeout", async () => {
    jest.useFakeTimers();
    mockAwaiting = true;
    render(<StakeAmount />);

    expect(mockSyncDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SYNC_ONE_ACCOUNT",
        accountId: "tezos-acc-1",
        reason: "tezos-stake-await-delegation",
      }),
    );
    expect(screen.queryByTestId("tezos-stake-amount-continue")).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(AWAIT_DELEGATION_POLL_INTERVAL_MS * MAX_AWAIT_DELEGATION_POLLS);
    });

    // 1 eager dispatch + (MAX - 1) interval dispatches, then polling stops and the form appears.
    expect(mockSyncDispatch).toHaveBeenCalledTimes(MAX_AWAIT_DELEGATION_POLLS);
    expect(screen.getByTestId("tezos-stake-amount-continue")).toBeTruthy();
  });

  it("surfaces a bridge error once the delegation is no longer awaited", async () => {
    mockBridgeError = new Error("prepare failed");
    render(<StakeAmount />);
    expect(await screen.findByTestId("bridge-error-modal")).toBeTruthy();
  });

  it("hides bridge errors while the delegation is still propagating", () => {
    mockAwaiting = true;
    mockBridgeError = new Error("prepare failed");
    render(<StakeAmount />);
    expect(screen.queryByTestId("bridge-error-modal")).toBeNull();
  });

  it("forwards the amount error to the input once an amount is entered", async () => {
    mockStatus = {
      errors: { amount: new Error("amount too high") },
      warnings: {},
      amount: new BigNumber(100),
    };
    render(<StakeAmount />);
    expect(await screen.findByTestId("amount-input-error")).toBeTruthy();
  });

  it("suppresses the amount error while the field is still empty", async () => {
    mockStatus = {
      errors: { amount: new Error("amount too high") },
      warnings: {},
      amount: new BigNumber(0),
    };
    render(<StakeAmount />);
    await screen.findByTestId("amount-input");
    expect(screen.queryByTestId("amount-input-error")).toBeNull();
  });

  it("shows the estimated network fee once loaded", async () => {
    render(<StakeAmount />);
    expect(await screen.findByText("send.fees.title")).toBeTruthy();
  });
});
