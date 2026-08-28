import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import SendRowTransferId from "../SendRowTransferId";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { accountId: "casper-account" } }),
  useTheme: () => ({ colors: { live: "#627EEA", darkBlue: "#142533" } }),
}));

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return { Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text> };
});

jest.mock("~/screens/SendFunds/SummaryRow", () => {
  const { TouchableOpacity, View } = jest.requireActual("react-native");
  return ({
    title,
    onPress,
    children,
  }: {
    title: React.ReactNode;
    onPress?: () => void;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity testID="summary-row" onPress={onPress}>
      <View>{title}</View>
      <View>{children}</View>
    </TouchableOpacity>
  );
});

const baseTransaction: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  memoType: null,
  memoValue: null,
};

const mockAccount = { id: "casper-account" } as any;

const baseProps = {
  account: mockAccount,
  transaction: baseTransaction,
};

describe("SendRowTransferId (Casper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the edit link when no transferId is set", () => {
    render(<SendRowTransferId {...baseProps} />);
    expect(screen.getByText("send.summary.transferId")).toBeDefined();
    expect(screen.getByText("common.edit")).toBeDefined();
  });

  it("shows the transferId value when it is set", () => {
    render(
      <SendRowTransferId {...baseProps} transaction={{ ...baseTransaction, memoValue: "12345" }} />,
    );
    expect(screen.getByText("12345")).toBeDefined();
  });

  it("navigates to CasperEditTransferId on press", () => {
    render(<SendRowTransferId {...baseProps} />);
    fireEvent.press(screen.getByText("common.edit"));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      "CasperEditTransferId",
      expect.objectContaining({ accountId: mockAccount.id }),
    );
  });
});
