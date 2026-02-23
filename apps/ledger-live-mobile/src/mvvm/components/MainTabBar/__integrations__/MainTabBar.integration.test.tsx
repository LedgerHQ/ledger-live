import React from "react";
import { View, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorName } from "~/const";
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
const SwapScreen = () => <StubScreen label="Swap Content" />;
const EarnScreen = () => <StubScreen label="Earn Content" />;
const CardScreen = () => <StubScreen label="Card Content" />;

function TestNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <MainTabBar {...(props as MainTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={NavigatorName.Portfolio} component={PortfolioScreen} />
      <Tab.Screen name={NavigatorName.Earn} component={EarnScreen} />
      <Tab.Screen name={NavigatorName.Swap} component={SwapScreen} />
      <Tab.Screen name={NavigatorName.CardTab} component={CardScreen} />
    </Tab.Navigator>
  );
}

describe("MainTabBar Integration", () => {
  it("should render all tab labels", () => {
    render(<TestNavigator />);

    ["Home", "Earn", "Swap", "Card"].forEach(name =>
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
      { tab: "Swap", content: "Swap Content" },
      { tab: "Card", content: "Card Content" },
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
