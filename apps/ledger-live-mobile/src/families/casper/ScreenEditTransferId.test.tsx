import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import { ScreenName } from "~/const";

const mockUpdateTransaction = jest.fn(
  (tx: CasperTransaction, patch: Partial<CasperTransaction>) => ({
    ...tx,
    ...patch,
  }),
);

const mockNavigation = { navigate: jest.fn(), pop: jest.fn() };

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("~/i18n/instance", () => ({ t: (k: string) => k }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: mockUpdateTransaction }),
}));

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
  useTheme: () => ({ colors: { background: "#fff", darkBlue: "#000" } }),
}));

jest.mock("~/components/SafeAreaView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => React.createElement(View, {}, children);
});

jest.mock("~/components/KeyboardView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => React.createElement(View, {}, children);
});

jest.mock("~/components/Button", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, onPress, event }: { title: string; onPress: () => void; event: string }) =>
    React.createElement(
      TouchableOpacity,
      { testID: `btn-${event}`, onPress },
      React.createElement(Text, {}, title),
    );
});

jest.mock("~/components/FocusedTextInput", () => {
  const { TextInput } = require("react-native");
  return (props: Record<string, unknown>) =>
    React.createElement(TextInput, { testID: "transfer-id-text-input", ...props });
});

jest.mock("~/helpers/navigationHelpers", () => ({
  popToScreen: jest.fn(),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "casper-account-id", type: "Account" } }),
}));

import { component as CasperEditTransferId } from "./ScreenEditTransferId";
import { popToScreen } from "~/helpers/navigationHelpers";

const baseTx: CasperTransaction = {
  family: "casper",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  useAllAmount: false,
  transferId: undefined,
};

const makeRoute = (transaction = baseTx) => ({
  params: { transaction, accountId: "casper-account-id" },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CasperEditTransferId", () => {
  it("renders text input and validate button", () => {
    const { getByTestId } = render(
      <CasperEditTransferId navigation={mockNavigation as never} route={makeRoute() as never} />,
    );

    expect(getByTestId("transfer-id-text-input")).toBeTruthy();
    expect(getByTestId("btn-CasperEditTransferId")).toBeTruthy();
  });

  it("strips non-digit characters when input changes", () => {
    const { getByTestId } = render(
      <CasperEditTransferId navigation={mockNavigation as never} route={makeRoute() as never} />,
    );

    const input = getByTestId("transfer-id-text-input");
    fireEvent.changeText(input, "abc123def");

    // After update, the input value should reflect only digits
    expect(getByTestId("transfer-id-text-input").props.value).toBe("123");
  });

  it("clears transferId when input becomes empty", () => {
    const { getByTestId } = render(
      <CasperEditTransferId
        navigation={mockNavigation as never}
        route={makeRoute({ ...baseTx, transferId: "456" }) as never}
      />,
    );

    fireEvent.changeText(getByTestId("transfer-id-text-input"), "");
    expect(getByTestId("transfer-id-text-input").props.value).toBe("");
  });

  it("calls popToScreen with updated transaction on validate", () => {
    const { getByTestId } = render(
      <CasperEditTransferId navigation={mockNavigation as never} route={makeRoute() as never} />,
    );

    fireEvent.changeText(getByTestId("transfer-id-text-input"), "789");
    fireEvent.press(getByTestId("btn-CasperEditTransferId"));

    expect(popToScreen).toHaveBeenCalledTimes(1);
    expect(popToScreen).toHaveBeenCalledWith(
      mockNavigation,
      ScreenName.SendSummary,
      expect.objectContaining({ accountId: "casper-account-id" }),
    );
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      baseTx,
      expect.objectContaining({
        transferId: "789",
        memoType: "transferId",
        memoValue: "789",
      }),
    );
  });

  it("calls popToScreen with undefined transferId when validate is pressed with empty input", () => {
    const { getByTestId } = render(
      <CasperEditTransferId navigation={mockNavigation as never} route={makeRoute() as never} />,
    );

    fireEvent.press(getByTestId("btn-CasperEditTransferId"));

    expect(popToScreen).toHaveBeenCalledTimes(1);
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      baseTx,
      expect.objectContaining({
        transferId: undefined,
        memoType: "transferId",
        memoValue: undefined,
      }),
    );
  });
});
