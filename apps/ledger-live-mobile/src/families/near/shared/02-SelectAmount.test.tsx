import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { ScreenName } from "~/const";
import SelectAmount from "./02-SelectAmount";

const navigate = jest.fn();
const bridgeUpdateTransaction = jest.fn((transaction: object, patch: object) => ({
  ...transaction,
  ...patch,
}));
const account = genAccount("near-staking-amount", {
  currency: getCryptoCurrencyById("near"),
});

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account }),
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
    useTranslation: () => ({
      t: (key: string) => {
        const errorName = key.match(/^errors\.([^.]+)\.title$/)?.[1];
        return errorName ?? key;
      },
    }),
  };
});
jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));
jest.mock("~/components/KeyboardView", () => {
  const { View } = jest.requireActual("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
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

type Mode = "stake" | "unstake" | "withdraw";

function StatefulScreen({ mode }: { mode: Mode }) {
  const [transaction, setTransaction] = useState({
    family: "near" as const,
    mode,
    recipient: "validator.near",
    amount: new BigNumber(99),
    useAllAmount: false,
  });
  const max = new BigNumber(100);
  const errorName =
    transaction.amount.gt(max) && !transaction.useAllAmount
      ? mode === "unstake"
        ? "NearNotEnoughStaked"
        : mode === "withdraw"
          ? "NearNotEnoughAvailable"
          : "NotEnoughBalance"
      : undefined;
  const status = {
    errors: errorName ? { amount: Object.assign(new Error(), { name: errorName }) } : {},
    warnings: {},
  };
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

  return (
    <SelectAmount
      navigation={{ navigate } as never}
      route={
        {
          name: screenName,
          params: {
            accountId: account.id,
            transaction,
            value: transaction.amount,
            max,
            nextScreen,
            updateTransaction: setTransaction,
            bridgePending: false,
            status,
            ...(mode === "stake" ? { validator: { validatorAddress: "validator.near" } } : {}),
          },
        } as never
      }
    />
  );
}

function renderScreen(mode: Mode) {
  return render(<StatefulScreen mode={mode} />);
}

describe("NEAR staking amount", () => {
  beforeEach(() => {
    navigate.mockReset();
    bridgeUpdateTransaction.mockClear();
  });

  it.each([
    ["unstaked", "unstake", "NearNotEnoughStaked"],
    ["withdrawable", "withdraw", "NearNotEnoughAvailable"],
  ] as const)(
    "should retain an amount above the %s balance and block Continue",
    (_, mode, errorName) => {
      renderScreen(mode);

      fireEvent.press(screen.getByText("100%"));
      fireEvent.changeText(screen.getByTestId("near-delegation-amount-input"), "101");

      expect(screen.getByTestId("near-delegation-amount-input").props.value).toBe("101");
      expect(screen.getByTestId("send-amount-error")).toHaveTextContent(
        `errors.${errorName}.title`,
      );
      expect(screen.getByTestId("near-delegation-amount-continue")).toBeDisabled();
    },
  );

  it("should set useAllAmount only when 100% is selected", () => {
    renderScreen("stake");

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
});
