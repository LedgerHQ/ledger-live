import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { BorrowSwapNavigationParams } from "@ledgerhq/live-common/wallet-api/Borrow/types";
import { NavigatorName, ScreenName } from "~/const";
import BorrowLiveAppNavigator from "../BorrowLiveAppNavigator";

const baseNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ navigate: baseNavigate }),
  };
});

jest.mock("LLM/features/Borrow", () => ({
  BorrowLiveAppWrapper: ({
    onWalletApiGoToSwap,
  }: {
    onWalletApiGoToSwap?: (params: BorrowSwapNavigationParams) => void;
  }) => (
    <>
      <Text testID="borrow-live-app-wrapper">Borrow Live App</Text>
      <Pressable
        testID="go-to-swap"
        onPress={() =>
          onWalletApiGoToSwap?.({
            fromCurrencyId: "ethereum",
            toCurrencyId: "bitcoin",
            amountFrom: "1",
            affiliate: "borrow-app",
          })
        }
      >
        <Text>Go to swap</Text>
      </Pressable>
    </>
  ),
}));

const expectedSwapParams = {
  fromCurrencyId: "ethereum",
  toCurrencyId: "bitcoin",
  amountFrom: "1",
  affiliate: "borrow-app",
  fromPath: ScreenName.Borrow,
};

describe("BorrowLiveAppNavigator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the borrow live app wrapper screen", () => {
    render(<BorrowLiveAppNavigator />);

    expect(screen.getByTestId("borrow-live-app-wrapper")).toBeOnTheScreen();
  });

  it("routes go-to-swap through the Main navigator", async () => {
    const { user } = render(<BorrowLiveAppNavigator />);

    await user.press(screen.getByTestId("go-to-swap"));

    expect(baseNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Swap,
      params: {
        screen: ScreenName.SwapTab,
        params: expectedSwapParams,
      },
    });
  });
});
