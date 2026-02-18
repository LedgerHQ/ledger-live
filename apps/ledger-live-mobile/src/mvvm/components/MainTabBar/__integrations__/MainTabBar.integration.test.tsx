import React from "react";
import { View, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorName, ScreenName } from "~/const";
import { MainTabBar } from "../index";
import type { MainTabBarProps } from "../types";

const Tab = createBottomTabNavigator();

function StubScreen({ label }: { readonly label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}

const PortfolioScreen = () => <StubScreen label="Portfolio Content" />;
const EarnScreen = () => <StubScreen label="Earn Content" />;
const TransferScreen = () => <StubScreen label="Transfer Content" />;
const DiscoverScreen = () => <StubScreen label="Discover Content" />;
const MyLedgerScreen = () => <StubScreen label="My Ledger Content" />;

function TestNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <MainTabBar {...(props as MainTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={NavigatorName.Portfolio} component={PortfolioScreen} />
      <Tab.Screen name={NavigatorName.Earn} component={EarnScreen} />
      <Tab.Screen name={ScreenName.Transfer} component={TransferScreen} />
      <Tab.Screen name={NavigatorName.Discover} component={DiscoverScreen} />
      <Tab.Screen name={NavigatorName.MyLedger} component={MyLedgerScreen} />
    </Tab.Navigator>
  );
}

describe("MainTabBar Integration", () => {
  it("should render all tab labels", () => {
    render(<TestNavigator />);

    ["Home", "Earn", "Transfer", "Discover", "Ledger"].forEach(name =>
      expect(screen.getByRole("tab", { name })).toBeVisible(),
    );
  });

  it("should render the first tab screen by default", () => {
    render(<TestNavigator />);

    expect(screen.getByText("Portfolio Content")).toBeVisible();
  });

  it("should navigate to tab when pressed", async () => {
    const { user } = render(<TestNavigator />);

    const cases = [
      { tab: "Earn", content: "Earn Content" },
      { tab: "Transfer", content: "Transfer Content" },
      { tab: "Discover", content: "Discover Content" },
      { tab: "Ledger", content: "My Ledger Content" },
    ];

    for (const { tab, content } of cases) {
      await user.press(screen.getByRole("tab", { name: tab }));
      expect(screen.getByText(content)).toBeVisible();
    }
  });

  it("should mark the active tab as selected", () => {
    render(<TestNavigator />);

    const homeTab = screen.getByRole("tab", { name: "Home" });
    expect(homeTab).toHaveProp("accessibilityState", { selected: true });
  });
});
