import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MainTabBar } from "LLM/components/MainTabBar";
import { Wallet40TabNavigator } from "./Wallet40TabNavigator";

jest.mock("../PortfolioNavigator", () => () => <Text>Portfolio Content</Text>);
jest.mock("../SwapNavigator", () => () => <Text>Swap Content</Text>);
jest.mock("../EarnLiveAppNavigator", () => () => <Text>Earn Content</Text>);
jest.mock("LLM/features/Card", () => () => <Text>Card Content</Text>);
jest.mock("LLM/features/PayTab", () => ({
  __esModule: true,
  default: () => <Text>Pay Content</Text>,
  getPayTabScreenOptions: {},
}));
jest.mock("~/screens/Swap/LiveApp/components/SwapWallet40Header", () => ({
  SwapWallet40Header: () => null,
}));
jest.mock("~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState", () => ({
  resetSwapWallet40HeaderState: jest.fn(),
}));

function TestNavigator({ isPayTabEnabled }: { readonly isPayTabEnabled: boolean }) {
  return (
    <Wallet40TabNavigator
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => (
        <MainTabBar {...props} isPayTabEnabled={isPayTabEnabled} />
      )}
    />
  );
}

describe("Wallet40TabNavigator", () => {
  it("should keep Pay focused when lwmPayTab changes", async () => {
    const { rerender, user } = render(<TestNavigator isPayTabEnabled />);

    await user.press(screen.getByRole("tab", { name: "Pay" }));
    expect(screen.getByText("Pay Content")).toBeVisible();

    rerender(<TestNavigator isPayTabEnabled={false} />);

    expect(screen.getByText("Pay Content")).toBeVisible();
    expect(screen.queryByText("Portfolio Content")).toBeNull();
    expect(screen.getByRole("tab", { name: "Card" })).toBeVisible();
    expect(screen.queryByRole("tab", { name: "Pay" })).toBeNull();
  });
});
