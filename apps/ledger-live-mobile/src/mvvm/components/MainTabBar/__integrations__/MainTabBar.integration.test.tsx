import React from "react";
import { View, Text } from "react-native";
import { act, render, screen } from "@tests/test-renderer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorName } from "~/const";
import * as stakeLabelHelpers from "~/helpers/getStakeLabelLocaleBased";
import { makeMutable } from "react-native-reanimated";
import {
  INITIAL_SCROLL_COMPACTION_TRACKING,
  SCROLL_COMPACTION_DIRECTION_THRESHOLD,
} from "@shared/scroll-compaction";
import { MainTabBar } from "../index";
import { resetTabBarDensity } from "../tabBarDensityStore";
import { updateTabBarDensityOnUI } from "../updateTabBarDensityOnUI";
import type { MainTabBarProps } from "../types";

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  ...jest.requireActual("~/helpers/getStakeLabelLocaleBased"),
  getEarnOrYieldSuffix: jest.fn(() => "earn" as const),
}));

const mockGetEarnOrYieldSuffix = jest.mocked(stakeLabelHelpers.getEarnOrYieldSuffix);

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
const AgentsScreen = () => <StubScreen label="Agents Content" />;

function getTabLabelContainer(label: string) {
  let node = screen.getByText(label).parent;
  while (node && !("jestAnimatedStyle" in node.props)) {
    node = node.parent;
  }
  if (!node) throw new Error(`No animated container for the "${label}" tab label`);
  return node;
}

const MID_OFFSET = 500;

/** Feeds scroll events to the tab bar the way a tab root's UI-thread scroll handler does. */
function createTabRootScroll() {
  const tracking = makeMutable(INITIAL_SCROLL_COMPACTION_TRACKING);
  return (offsets: readonly number[]) => {
    act(() => {
      offsets.forEach(y =>
        updateTabBarDensityOnUI(tracking, {
          contentOffset: { x: 0, y },
          contentSize: { width: 400, height: 3000 },
          layoutMeasurement: { width: 400, height: 800 },
        }),
      );
      jest.runAllTimers();
    });
    act(() => jest.runAllTimers());
  };
}

const SCROLL_DOWN = [MID_OFFSET, MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD];

function TestNavigator({
  withAgentsTab = false,
  hideTabBar = false,
}: {
  readonly withAgentsTab?: boolean;
  readonly hideTabBar?: boolean;
}) {
  return (
    <Tab.Navigator
      tabBar={props => <MainTabBar {...(props as MainTabBarProps)} hideTabBar={hideTabBar} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={NavigatorName.Portfolio} component={PortfolioScreen} />
      <Tab.Screen name={NavigatorName.Earn} component={EarnScreen} />
      <Tab.Screen name={NavigatorName.Swap} component={SwapScreen} />
      <Tab.Screen name={NavigatorName.CardTab} component={CardScreen} />
      {withAgentsTab ? (
        <Tab.Screen name={NavigatorName.AgentIntentTab} component={AgentsScreen} />
      ) : null}
    </Tab.Navigator>
  );
}

describe("MainTabBar Integration", () => {
  afterEach(() => {
    resetTabBarDensity();
  });

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

  it("should render 'Yield' instead of 'Earn' for GB users", () => {
    mockGetEarnOrYieldSuffix.mockReturnValueOnce("yield");

    render(<TestNavigator />);

    expect(screen.getByRole("tab", { name: "Yield" })).toBeVisible();
    expect(screen.queryByRole("tab", { name: "Earn" })).toBeNull();
  });

  it("should render and open the Agents tab as a fifth tab", async () => {
    const { user } = render(<TestNavigator withAgentsTab />);

    ["Home", "Earn", "Swap", "Card", "Agents"].forEach(name =>
      expect(screen.getByRole("tab", { name })).toBeVisible(),
    );

    await user.press(screen.getByRole("tab", { name: "Agents" }));

    expect(screen.getByText("Agents Content")).toBeVisible();
    expect(screen.getByRole("tab", { name: "Agents" })).toHaveProp("accessibilityState", {
      selected: true,
    });
  });

  it("should keep the tabs working when the Agents tab is added after mount", async () => {
    const { user, rerender } = render(<TestNavigator />);

    rerender(<TestNavigator withAgentsTab />);
    await user.press(screen.getByRole("tab", { name: "Agents" }));

    expect(screen.getByText("Agents Content")).toBeVisible();
  });

  describe("scroll density", () => {
    it("should hide the tab labels when the tab root scrolls down", () => {
      render(<TestNavigator />);
      const scrollTo = createTabRootScroll();

      scrollTo(SCROLL_DOWN);

      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 0 });
      expect(screen.getByRole("tab", { name: "Home" })).toBeVisible();
    });

    it("should show the tab labels again when the tab root scrolls back up", () => {
      render(<TestNavigator />);
      const scrollTo = createTabRootScroll();
      scrollTo(SCROLL_DOWN);

      scrollTo([MID_OFFSET - 1]);

      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 1 });
    });

    it("should navigate and expand when a tab is pressed while compact", async () => {
      const { user } = render(<TestNavigator />);
      createTabRootScroll()(SCROLL_DOWN);

      await user.press(screen.getByRole("tab", { name: "Earn" }));
      act(() => jest.runAllTimers());

      expect(screen.getByText("Earn Content")).toBeVisible();
      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 1 });
    });

    it("should expand when the active tab is pressed again", async () => {
      const { user } = render(<TestNavigator />);
      createTabRootScroll()(SCROLL_DOWN);

      await user.press(screen.getByRole("tab", { name: "Home" }));
      act(() => jest.runAllTimers());

      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 1 });
    });

    it("should not compact again on the next small scroll after a re-press", async () => {
      const { user } = render(<TestNavigator />);
      const scrollTo = createTabRootScroll();
      scrollTo([0, 32, 48, MID_OFFSET]);
      await user.press(screen.getByRole("tab", { name: "Home" }));

      scrollTo([MID_OFFSET + 1]);

      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 1 });
    });

    it("should show the tab bar expanded when a screen that hid it scrolled down", () => {
      const { rerender } = render(<TestNavigator hideTabBar />);
      createTabRootScroll()(SCROLL_DOWN);

      rerender(<TestNavigator />);
      act(() => jest.runAllTimers());

      expect(getTabLabelContainer("Home")).toHaveAnimatedStyle({ opacity: 1 });
    });
  });
});
