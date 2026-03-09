import React from "react";
import { Pressable, Text } from "react-native";
import { render } from "@tests/test-renderer";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { NavigatorName } from "~/const";
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
    onClosePress,
    showBackButton,
    titleKey,
  }: {
    onBackPress: () => void;
    onClosePress?: () => void;
    showBackButton?: boolean;
    titleKey: string | null;
  }) => (
    <>
      <Text testID="swap-opaque-title">{titleKey ?? ""}</Text>
      {showBackButton !== false ? (
        <Pressable testID="swap-opaque-back" onPress={onBackPress}>
          <Text>back</Text>
        </Pressable>
      ) : null}
      {onClosePress ? (
        <Pressable testID="swap-opaque-close" onPress={onClosePress}>
          <Text>close</Text>
        </Pressable>
      ) : null}
    </>
  ),
}));

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSwapWallet40HeaderState = jest.mocked(useSwapWallet40HeaderState);

describe("SwapWallet40Header", () => {
  const goBack = jest.fn();
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockImplementation(() => ({ goBack, dispatch }));
  });

  it("should render transparent top bar header when header style is transparent", () => {
    mockedUseSwapWallet40HeaderState.mockReturnValue({
      headerStyle: "transparent",
      titleKey: null,
      canGoBack: false,
      isTransactionComplete: false,
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
      isTransactionComplete: false,
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
      isTransactionComplete: false,
      goBackWebview: null,
      routeName: "quotesList",
    });

    const { user, getByTestId } = render(<SwapWallet40Header />);

    await user.press(getByTestId("swap-opaque-back"));

    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("should show close-only action for completed swap and reset to swap form", async () => {
    mockedUseSwapWallet40HeaderState.mockReturnValue({
      headerStyle: "opaque",
      titleKey: "transfer.swap2.twoStepApproval.completedTitle",
      canGoBack: true,
      isTransactionComplete: true,
      goBackWebview: jest.fn(),
      routeName: "multiStepTransaction",
    });

    const { user, queryByTestId, getByTestId } = render(<SwapWallet40Header />);

    expect(queryByTestId("swap-opaque-back")).toBeNull();

    await user.press(getByTestId("swap-opaque-close"));

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: NavigatorName.Swap }],
      }),
    );
    expect(goBack).not.toHaveBeenCalled();
  });
});
