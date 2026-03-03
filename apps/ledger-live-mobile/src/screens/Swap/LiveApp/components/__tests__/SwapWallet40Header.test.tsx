import React from "react";
import { Pressable, Text } from "react-native";
import { render } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { SwapWallet40Header } from "../SwapWallet40Header";
import { useSwapWallet40HeaderState } from "../../navigationHandlers/wallet40/useSwapWallet40HeaderState";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("../../navigationHandlers/wallet40/useSwapWallet40HeaderState", () => ({
  useSwapWallet40HeaderState: jest.fn(),
}));

jest.mock("../SwapTopBarHeader", () => ({
  SwapTopBarHeader: () => <Text testID="swap-topbar-header">swap-topbar-header</Text>,
}));

jest.mock("../SwapOpaqueHeader", () => ({
  SwapOpaqueHeader: ({
    onBackPress,
    titleKey,
  }: {
    onBackPress: () => void;
    titleKey: string | null;
  }) => (
    <>
      <Text testID="swap-opaque-title">{titleKey ?? ""}</Text>
      <Pressable testID="swap-opaque-back" onPress={onBackPress}>
        <Text>back</Text>
      </Pressable>
    </>
  ),
}));

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSwapWallet40HeaderState = jest.mocked(useSwapWallet40HeaderState);

describe("SwapWallet40Header", () => {
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockImplementation(() => ({ goBack }));
  });

  it("should render transparent top bar header when header style is transparent", () => {
    mockedUseSwapWallet40HeaderState.mockReturnValue({
      headerStyle: "transparent",
      titleKey: null,
      canGoBack: false,
      goBackWebview: null,
      routeName: "home",
    });

    const { getByTestId, queryByTestId } = render(<SwapWallet40Header />);

    expect(getByTestId("swap-topbar-header")).toBeTruthy();
    expect(queryByTestId("swap-opaque-back")).toBeNull();
  });

  it("should use webview goBack when canGoBack is true", async () => {
    const goBackWebview = jest.fn();
    mockedUseSwapWallet40HeaderState.mockReturnValue({
      headerStyle: "opaque",
      titleKey: "transfer.swap2.quotesList.title",
      canGoBack: true,
      goBackWebview,
      routeName: "quotesList",
    });

    const { user, getByTestId } = render(<SwapWallet40Header />);

    await user.press(getByTestId("swap-opaque-back"));

    expect(goBackWebview).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should fallback to navigation goBack when webview cannot go back", async () => {
    mockedUseSwapWallet40HeaderState.mockReturnValue({
      headerStyle: "opaque",
      titleKey: "transfer.swap2.quotesList.title",
      canGoBack: false,
      goBackWebview: null,
      routeName: "quotesList",
    });

    const { user, getByTestId } = render(<SwapWallet40Header />);

    await user.press(getByTestId("swap-opaque-back"));

    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
