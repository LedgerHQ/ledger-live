import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import { component as CasperEditTransferId } from "../ScreenEditTransferId";

const mockUpdateTransaction = jest.fn((t, patch) => ({ ...t, ...patch }));
const mockPopToScreen = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: mockUpdateTransaction }),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "casper-account", type: "Account" } }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useTheme: () => ({ colors: { background: "#fff", darkBlue: "#142533" } }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("~/helpers/navigationHelpers", () => ({
  popToScreen: (...args: unknown[]) => mockPopToScreen(...args),
}));

jest.mock("~/components/SafeAreaView", () => {
  const { View } = jest.requireActual("react-native");
  return ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={style}>{children}</View>
  );
});

jest.mock("~/components/KeyboardView", () => {
  const { View } = jest.requireActual("react-native");
  return ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={style}>{children}</View>
  );
});

jest.mock("~/components/Button", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onPress, title, event }: { onPress: () => void; title?: string; event?: string }) => (
    <TouchableOpacity testID={event} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock("~/components/FocusedTextInput", () => {
  const { TextInput } = jest.requireActual("react-native");
  return (props: object) => <TextInput testID="transfer-id-input" {...props} />;
});

const baseTransaction: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  memoType: null,
  memoValue: "42",
};

const makeProps = (txOverrides: Partial<Transaction> = {}) =>
  ({
    navigation: { navigate: mockNavigate },
    route: {
      params: {
        accountId: "casper-account",
        transaction: { ...baseTransaction, ...txOverrides },
      },
    },
  }) as any;

describe("CasperEditTransferId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the text input and validate button", () => {
    render(<CasperEditTransferId {...makeProps()} />);
    expect(screen.getByTestId("transfer-id-input")).toBeDefined();
    expect(screen.getByTestId("CasperEditTransferId")).toBeDefined();
  });

  it("strips non-digits when the user types", () => {
    render(<CasperEditTransferId {...makeProps({ memoValue: null })} />);
    const input = screen.getByTestId("transfer-id-input");
    fireEvent.changeText(input, "abc123");
    expect(input.props.value).toBe("123");
  });

  it("calls popToScreen with the updated transaction on validate", () => {
    render(<CasperEditTransferId {...makeProps()} />);
    fireEvent.press(screen.getByTestId("CasperEditTransferId"));
    expect(mockPopToScreen).toHaveBeenCalledTimes(1);
    const [, , params] = mockPopToScreen.mock.calls[0];
    expect(params.transaction.transferId).toBe("42");
    expect(params.transaction.memoType).toBe("transferId");
    expect(params.transaction.memoValue).toBe("42");
  });

  it("clears transferId when the input is emptied before validating", () => {
    render(<CasperEditTransferId {...makeProps()} />);
    fireEvent.changeText(screen.getByTestId("transfer-id-input"), "");
    fireEvent.press(screen.getByTestId("CasperEditTransferId"));
    const [, , params] = mockPopToScreen.mock.calls[0];
    expect(params.transaction.transferId).toBeUndefined();
    expect(params.transaction.memoType).toBeNull();
    expect(params.transaction.memoValue).toBeNull();
  });
});
