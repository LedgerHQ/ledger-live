import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import StakingSummary from "../StakingFlow/02-Summary";
import { createMockMinaAccount, createMockTransaction, mockValidators } from "./testUtils";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";

const navigate = jest.fn();
const createTransaction = jest.fn(() => ({ family: "mina" }));
const updateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));
const setTransaction = jest.fn();

let bridgeTransactionState: {
  transaction: unknown;
  setTransaction: typeof setTransaction;
  status: { errors: Record<string, Error>; warnings: Record<string, Error> };
  bridgePending: boolean;
  bridgeError: Error | null;
};

jest.mock("~/context/hooks", () => ({ useSelector: jest.fn() }));

jest.mock("~/reducers/accounts", () => ({ accountScreenSelector: jest.fn(() => jest.fn()) }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ createTransaction, updateTransaction }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => bridgeTransactionState,
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: jest.fn(() => ({ id: "mina", ticker: "MINA", color: "#E39844" })),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  formatCurrencyUnit: jest.fn(() => "10 MINA"),
  getCurrencyColor: jest.fn(() => "#E39844"),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ name: "MINA", code: "MINA", magnitude: 9 }),
}));

jest.mock("@react-navigation/native", () => ({
  useTheme: () => ({
    colors: { background: "#000", card: "#111", primary: "#0f0", white: "#fff" },
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

jest.mock("@ledgerhq/native-ui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
    Icons: new Proxy({}, { get: () => () => null }),
  };
});

jest.mock("~/context/Locale", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement(Text, null, i18nKey),
  };
});

jest.mock("~/analytics", () => ({ TrackScreen: () => null }));

jest.mock("../../../colors", () => ({ rgba: () => "rgba(0,0,0,0.2)" }));

jest.mock("../../tezos/DelegatingContainer", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) =>
      React.createElement(View, null, left, right),
  };
});

jest.mock("~/components/Circle", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/CurrencyIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/CurrencyUnitValue", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { __esModule: true, default: () => React.createElement(Text, null, "10 MINA") };
});

jest.mock("~/components/Touchable", () => {
  const React = require("react");
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement(TouchableOpacity, { onPress }, children),
  };
});

jest.mock("~/components/TranslatedError", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ error }: { error?: Error }) =>
      error ? React.createElement(Text, null, `error:${error.message}`) : null,
  };
});

jest.mock("~/components/Button", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onPress,
      disabled,
      testID,
    }: {
      onPress: () => void;
      disabled?: boolean;
      testID?: string;
    }) =>
      React.createElement(
        TouchableOpacity,
        { onPress, disabled, testID, accessibilityState: { disabled: !!disabled } },
        React.createElement(Text, null, "continue"),
      ),
  };
});

const useSelectorMock = useSelector as unknown as jest.Mock;

const account = createMockMinaAccount();
const validator = mockValidators[0];
const transaction = createMockTransaction({ recipient: validator.address });

function renderSummary(params: Record<string, unknown> = {}) {
  const route = {
    key: "summary",
    name: ScreenName.MinaStakingSummary,
    params: { accountId: account.id, validator, ...params },
  };
  return render(
    <StakingSummary
      // The screen only reads `navigate` off the navigation prop.
      navigation={{ navigate } as never}
      route={route as never}
    />,
  );
}

describe("StakingFlow/02-Summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bridgeTransactionState = {
      transaction,
      setTransaction,
      status: { errors: {}, warnings: {} },
      bridgePending: false,
      bridgeError: null,
    };
    useSelectorMock.mockReturnValue({ account, parentAccount: undefined });
  });

  it("summarises the delegated amount and the chosen validator", () => {
    renderSummary();

    expect(screen.getByText("mina.delegation.iDelegate")).toBeOnTheScreen();
    expect(screen.getByText("delegation.to")).toBeOnTheScreen();
    expect(screen.getByTestId("mina-delegation-summary-validator")).toHaveTextContent(
      validator.name,
    );
  });

  it("falls back to the validator address when it has no name", () => {
    renderSummary({ validator: { ...validator, name: undefined } });

    expect(screen.getByTestId("mina-delegation-summary-validator")).toHaveTextContent(
      validator.address,
    );
  });

  it("realigns the transaction recipient on the selected validator", () => {
    renderSummary();

    expect(updateTransaction).toHaveBeenCalledWith(transaction, { recipient: validator.address });
    expect(setTransaction).toHaveBeenCalled();
  });

  it("continues to the device step with the prepared transaction", async () => {
    const user = userEvent.setup();
    renderSummary();

    await user.press(screen.getByTestId("mina-summary-continue-button"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.MinaStakingSelectDevice, {
      accountId: account.id,
      parentId: undefined,
      validator,
      transaction,
      status: { errors: {}, warnings: {} },
    });
  });

  it("goes back to the validator step when the delegator is changed", async () => {
    const user = userEvent.setup();
    renderSummary();

    await user.press(screen.getByTestId("mina-delegation-summary-validator"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.MinaStakingValidator, {
      accountId: account.id,
      validator,
    });
  });

  it("surfaces the status error and blocks the continue button", () => {
    bridgeTransactionState.status = {
      errors: { amount: new Error("NotEnoughBalance") },
      warnings: {},
    };
    renderSummary();

    expect(screen.getByText("error:NotEnoughBalance")).toBeOnTheScreen();
    expect(screen.getByTestId("mina-summary-continue-button")).toBeDisabled();
  });

  it("blocks the continue button while the bridge is pending", () => {
    bridgeTransactionState.bridgePending = true;
    renderSummary();

    expect(screen.getByTestId("mina-summary-continue-button")).toBeDisabled();
  });

  it("blocks the continue button when the bridge errored", () => {
    bridgeTransactionState.bridgeError = new Error("bridge down");
    renderSummary();

    expect(screen.getByTestId("mina-summary-continue-button")).toBeDisabled();
  });
});
