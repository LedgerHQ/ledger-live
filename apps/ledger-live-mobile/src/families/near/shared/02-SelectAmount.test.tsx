import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import SelectAmount from "./02-SelectAmount";

const navigate = jest.fn();
const updateTransaction = jest.fn();
const bridgeUpdateTransaction = jest.fn((transaction: object, patch: object) => ({
  ...transaction,
  ...patch,
}));

const transaction = {
  family: "near",
  mode: "unstake",
  recipient: "validator.near",
  amount: new BigNumber(100),
  useAllAmount: false,
};

let status = {
  errors: {} as Record<string, Error>,
  warnings: {} as Record<string, Error>,
};

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "near-account", type: "Account" } }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "NEAR", magnitude: 0, name: "NEAR" }),
}));
jest.mock("~/hooks", () => ({ useSettings: () => ({ locale: "en" }) }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: bridgeUpdateTransaction }),
}));
jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});
jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));
jest.mock("~/components/KeyboardView", () => {
  const { View } = jest.requireActual("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});
jest.mock("~/screens/SendFunds/AmountInput", () => {
  const { Text, TextInput, View } = jest.requireActual("react-native");
  return ({
    value,
    onChange,
    error,
    testID,
  }: {
    value: BigNumber;
    onChange: (amount: BigNumber) => void;
    error: Error | null;
    testID: string;
  }) => (
    <View>
      <TextInput
        testID={testID}
        value={value.toString()}
        onChangeText={(text: string) => onChange(new BigNumber(text))}
      />
      {error ? <Text testID="amount-error">{error.name}</Text> : null}
    </View>
  );
});
jest.mock("~/components/Button", () => {
  const { Text, TouchableOpacity } = jest.requireActual("react-native");
  return ({
    disabled,
    onPress,
    title,
    testID,
  }: {
    disabled?: boolean;
    onPress: () => void;
    title: React.ReactNode;
    testID?: string;
  }) => (
    <TouchableOpacity testID={testID} disabled={disabled} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

function renderScreen({
  mode = "unstake",
  errorName,
  useAllAmount = false,
}: {
  mode?: "stake" | "unstake" | "withdraw";
  errorName?: "NearNotEnoughStaked" | "NearNotEnoughAvailable";
  useAllAmount?: boolean;
} = {}) {
  status = errorName
    ? { errors: { amount: Object.assign(new Error(), { name: errorName }) }, warnings: {} }
    : { errors: {}, warnings: {} };

  const screenName =
    mode === "stake"
      ? ScreenName.NearStakingAmount
      : mode === "unstake"
        ? ScreenName.NearUnstakingAmount
        : ScreenName.NearWithdrawingAmount;
  const nextScreen =
    mode === "stake"
      ? ScreenName.NearStakingValidator
      : mode === "unstake"
        ? ScreenName.NearUnstakingSelectDevice
        : ScreenName.NearWithdrawingSelectDevice;

  return render(
    <SelectAmount
      navigation={{ navigate } as never}
      route={
        {
          name: screenName,
          params: {
            accountId: "near-account",
            transaction: { ...transaction, mode, useAllAmount },
            value: transaction.amount,
            max: new BigNumber(100),
            nextScreen,
            updateTransaction,
            bridgePending: false,
            status,
            ...(mode === "stake" ? { validator: { validatorAddress: "validator.near" } } : {}),
          },
        } as never
      }
    />,
  );
}

describe("NEAR staking amount", () => {
  beforeEach(() => {
    navigate.mockReset();
    updateTransaction.mockReset();
    bridgeUpdateTransaction.mockClear();
    status = { errors: {}, warnings: {} };
  });

  it.each([
    ["unstaked", "unstake", "NearNotEnoughStaked"],
    ["withdrawable", "withdraw", "NearNotEnoughAvailable"],
  ] as const)(
    "should retain an amount above the %s balance and block Continue",
    (_, mode, errorName) => {
      renderScreen({ mode, errorName });

      fireEvent.changeText(screen.getByTestId("near-delegation-amount-input"), "101");

      expect(screen.getByTestId("near-delegation-amount-input").props.value).toBe("101");
      expect(screen.getByTestId("amount-error")).toHaveTextContent(errorName);
      expect(updateTransaction.mock.calls[0][0](transaction)).toMatchObject({
        amount: new BigNumber(101),
        useAllAmount: false,
      });
      expect(screen.getByTestId("near-delegation-amount-continue")).toBeDisabled();
    },
  );

  it("should set useAllAmount only when 100% is selected", () => {
    renderScreen({ mode: "stake" });

    fireEvent.changeText(screen.getByTestId("near-delegation-amount-input"), "100");
    fireEvent.press(screen.getByTestId("near-delegation-amount-continue"));

    expect(navigate).toHaveBeenLastCalledWith(
      ScreenName.NearStakingValidator,
      expect.objectContaining({ transaction: expect.objectContaining({ useAllAmount: false }) }),
    );

    fireEvent.press(screen.getByText("100%"));
    fireEvent.press(screen.getByTestId("near-delegation-amount-continue"));

    expect(navigate).toHaveBeenLastCalledWith(
      ScreenName.NearStakingValidator,
      expect.objectContaining({ transaction: expect.objectContaining({ useAllAmount: true }) }),
    );
  });

  it("should preserve an existing explicit maximum selection until the amount changes", () => {
    renderScreen({ mode: "stake", useAllAmount: true });

    fireEvent.press(screen.getByTestId("near-delegation-amount-continue"));

    expect(navigate).toHaveBeenLastCalledWith(
      ScreenName.NearStakingValidator,
      expect.objectContaining({ transaction: expect.objectContaining({ useAllAmount: true }) }),
    );

    fireEvent.changeText(screen.getByTestId("near-delegation-amount-input"), "99");
    fireEvent.press(screen.getByTestId("near-delegation-amount-continue"));

    expect(navigate).toHaveBeenLastCalledWith(
      ScreenName.NearStakingValidator,
      expect.objectContaining({ transaction: expect.objectContaining({ useAllAmount: false }) }),
    );
  });
});
