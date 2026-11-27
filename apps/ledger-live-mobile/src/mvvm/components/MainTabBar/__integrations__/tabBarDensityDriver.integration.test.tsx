import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { SCROLL_COMPACTION_DIRECTION_THRESHOLD } from "@shared/scroll-compaction";
import { NavigatorName } from "~/const";
import { getIsTabBarCompact, resetTabBarDensity } from "../tabBarDensityStore";
import { useIsTabBarDensityDriver } from "../useIsTabBarDensityDriver";
import { useTabBarDensityScrollHandler } from "../useTabBarDensityScrollHandler";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const OUTSIDE_SCREEN = "OutsideScreen";
const MID_OFFSET = 500;

function scrollEventAt(y: number) {
  return {
    nativeEvent: {
      contentOffset: { y },
      contentSize: { height: 3000 },
      layoutMeasurement: { height: 800 },
    },
  };
}

function DriverProbe({ name }: { readonly name: string }) {
  const isTabBarDriver = useIsTabBarDensityDriver();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const onScroll = useTabBarDensityScrollHandler();
  const scrollDown = () =>
    [MID_OFFSET, MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD].forEach(y =>
      onScroll(scrollEventAt(y)),
    );

  return (
    <>
      <Text>{`${name} drives: ${isTabBarDriver}`}</Text>
      <Pressable onPress={scrollDown}>
        <Text>{`${name} scroll down`}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate(NavigatorName.Earn)}>
        <Text>{`${name} open earn tab`}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate(OUTSIDE_SCREEN)}>
        <Text>{`${name} open outside screen`}</Text>
      </Pressable>
    </>
  );
}

const WalletProbe = () => <DriverProbe name="wallet" />;
const EarnProbe = () => <DriverProbe name="earn" />;
const OutsideProbe = () => <DriverProbe name="outside" />;

function MainTabs() {
  return (
    <Tab.Navigator tabBar={() => null} screenOptions={{ headerShown: false }}>
      <Tab.Screen name={NavigatorName.Portfolio} component={WalletProbe} />
      <Tab.Screen name={NavigatorName.Earn} component={EarnProbe} />
    </Tab.Navigator>
  );
}

function TestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={NavigatorName.Main} component={MainTabs} />
      <Stack.Screen name={OUTSIDE_SCREEN} component={OutsideProbe} />
    </Stack.Navigator>
  );
}

describe("tab bar density driver", () => {
  afterEach(() => {
    resetTabBarDensity();
  });

  it("should let the focused main tab root drive the tab bar", async () => {
    const { user } = render(<TestNavigator />);

    await user.press(screen.getByText("wallet scroll down"));

    expect(screen.getByText("wallet drives: true")).toBeVisible();
    expect(getIsTabBarCompact()).toBe(true);
  });

  it("should stop a tab root from driving once another tab is focused", async () => {
    const { user } = render(<TestNavigator />);

    await user.press(screen.getByText("wallet open earn tab"));

    expect(screen.getByText("wallet drives: false", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("earn drives: true")).toBeVisible();
  });

  it("should not let a screen stacked over the main tabs drive the tab bar", async () => {
    const { user } = render(<TestNavigator />);

    await user.press(screen.getByText("wallet open outside screen"));
    await user.press(screen.getByText("outside scroll down"));

    expect(screen.getByText("outside drives: false")).toBeVisible();
    expect(getIsTabBarCompact()).toBe(false);
  });
});
