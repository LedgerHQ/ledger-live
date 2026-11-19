import React from "react";
import { Dimensions, FlatList, Linking, Text, TouchableHighlight, View } from "react-native";
import type { ContentCard } from "@braze/react-native-sdk";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { ContentCardLocation, type NotificationContentCard } from "~/dynamicContent/types";
import { setDynamicContentNotificationCards } from "~/actions/dynamicContent";
import NotificationCenter from "./Notifications";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === "useAnimatedStyle") return () => ({});
      return Reflect.get(target, prop, receiver);
    },
  });
});

const Stack = createNativeStackNavigator();

function NotificationCenterScreen() {
  const navigation = useNavigation();
  return (
    <>
      <Text onPress={() => navigation.navigate("Away" as never)}>Leave notification centre</Text>
      <NotificationCenter />
    </>
  );
}

function AwayScreen() {
  const navigation = useNavigation();
  return <Text onPress={() => navigation.goBack()}>Back to notifications</Text>;
}

function NotificationCenterRoute() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <Stack.Screen name="Away" component={AwayScreen} />
    </Stack.Navigator>
  );
}

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Swipeable = React.forwardRef(
    (
      props: {
        children?: React.ReactNode;
        renderRightActions?: (
          progress: { value: number },
          translation: { value: number },
        ) => React.ReactNode;
      },
      ref: React.Ref<unknown>,
    ) => (
      <View ref={ref}>
        {props.children}
        {props.renderRightActions?.({ value: 0 }, { value: -120 })}
      </View>
    ),
  );
  Swipeable.displayName = "ReanimatedSwipeable";
  return { __esModule: true, default: Swipeable };
});

const CARD_ID = "nc-mobile-1";
const TITLE = "Recover your wallet";
const EXTRAS = {
  canvas_name: "Notification canvas",
  canvas_step_name: "Notification step",
  location: ContentCardLocation.NotificationCenter,
};

const notificationCard: NotificationContentCard = {
  id: CARD_ID,
  title: TITLE,
  description: "Set up Ledger Recover",
  location: ContentCardLocation.NotificationCenter,
  link: "ledgerlive://recover",
  cta: "Open",
  createdAt: Math.floor(Date.now() / 1000),
  viewed: false,
  extras: EXTRAS,
};

const brazeCard = {
  id: CARD_ID,
  created: notificationCard.createdAt,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: false,
  isControl: false,
  extras: EXTRAS,
  type: "Classic",
  title: TITLE,
  cardDescription: notificationCard.description,
} as ContentCard;

const clickPayload = {
  ...EXTRAS,
  screen: ContentCardLocation.NotificationCenter,
  campaign: CARD_ID,
  contentcard: TITLE,
};

const callsFor = (eventName: string) =>
  jest.mocked(track).mock.calls.filter(([event]) => event === eventName);

const renderCenter = ({ withCards = true }: { withCards?: boolean } = {}) =>
  render(<NotificationCenterRoute />, {
    overrideInitialState: state => ({
      ...state,
      settings: {
        ...state.settings,
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
      },
      dynamicContent: {
        ...state.dynamicContent,
        isLoading: false,
        notificationCards: withCards ? [notificationCard] : [],
        mobileCards: withCards ? [brazeCard] : [],
      },
    }),
  });

// On-screen rectangle reported by measureInWindow for the list; tests move it to simulate scrolling.
let listRect = { x: 0, y: 0, width: 120, height: 120 };

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// A full-width list as tall as the screen, shifted so `share` of it is on screen.
const rectWithVisibleShare = (share: number) => ({
  x: 0,
  y: screenHeight * (1 - share),
  width: screenWidth,
  height: screenHeight,
});

// Longer than the container check interval, so at least one check has run.
// Timers are faked globally in jest-setup, so time is advanced explicitly.
const WAIT_FOR_CHECKS_MS = 700;
const waitForChecks = () =>
  act(() => {
    jest.advanceTimersByTime(WAIT_FOR_CHECKS_MS);
  });

const containerImpressionPayload = {
  page: "",
  location: ContentCardLocation.NotificationCenter,
};

describe("NotificationCenter content cards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listRect = { x: 0, y: 0, width: 120, height: 120 };
    View.prototype.measureInWindow = callback => {
      callback(listRect.x, listRect.y, listRect.width, listRect.height);
    };
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
  });

  it("should render the notification and track a click with the card payload", async () => {
    const { user } = renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    await user.press(screen.getByText(TITLE));

    expect(callsFor(ContentCardEvent.Clicked)).toEqual([[ContentCardEvent.Clicked, clickPayload]]);
  });

  it("should track a dismiss with the card payload when the notification is removed", async () => {
    renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    const dismissButtons = screen.UNSAFE_getAllByType(TouchableHighlight);
    fireEvent.press(dismissButtons[dismissButtons.length - 1]);

    expect(callsFor(ContentCardEvent.Dismissed)).toEqual([
      [ContentCardEvent.Dismissed, clickPayload],
    ]);
  });

  it("should track a card impression when the notification becomes viewable", async () => {
    renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    const list = screen
      .UNSAFE_getAllByType(FlatList)
      .find(node =>
        Array.isArray(node.props.data)
          ? node.props.data.some((card: { id?: string }) => card.id === CARD_ID)
          : false,
      );

    act(() => {
      list?.props.onViewableItemsChanged({
        viewableItems: [{ item: notificationCard, key: CARD_ID, index: 0, isViewable: true }],
        changed: [],
      });
    });

    expect(callsFor(ContentCardEvent.Impression)).toEqual([
      [
        ContentCardEvent.Impression,
        {
          page: ContentCardLocation.NotificationCenter,
          location: ContentCardLocation.NotificationCenter,
          canvas_name: EXTRAS.canvas_name,
          canvas_step_name: EXTRAS.canvas_step_name,
        },
      ],
    ]);
  });

  it("should track a container impression when the notification list is in view", async () => {
    renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    await waitFor(() => {
      expect(callsFor("container_impression")).toEqual([
        ["container_impression", containerImpressionPayload],
      ]);
    });
  });

  it("should not track a container impression below 80% visible, and track it once when crossing 80%", async () => {
    listRect = rectWithVisibleShare(0.6);
    renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    await waitForChecks();
    expect(callsFor("container_impression")).toEqual([]);

    listRect = rectWithVisibleShare(0.9);
    await waitFor(() => {
      expect(callsFor("container_impression")).toHaveLength(1);
    });

    listRect = rectWithVisibleShare(1);
    await waitForChecks();
    expect(callsFor("container_impression")).toEqual([
      ["container_impression", containerImpressionPayload],
    ]);
  });

  it("should track a container impression for a list taller than the screen", async () => {
    listRect = {
      x: 0,
      y: -screenHeight * 0.5,
      width: screenWidth,
      height: screenHeight * 2,
    };
    renderCenter();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    await waitFor(() => {
      expect(callsFor("container_impression")).toEqual([
        ["container_impression", containerImpressionPayload],
      ]);
    });
  });

  it("should track a container impression when cards arrive while the empty list is visible", async () => {
    const { store } = renderCenter({ withCards: false });
    await waitForChecks();
    expect(callsFor("container_impression")).toEqual([]);

    act(() => {
      store.dispatch(setDynamicContentNotificationCards([notificationCard]));
    });

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    await waitFor(() => {
      expect(callsFor("container_impression")).toEqual([
        ["container_impression", containerImpressionPayload],
      ]);
    });
  });

  it("should not track a container impression from a measurement that resolves after the screen loses focus", async () => {
    const pendingMeasures: Array<(x: number, y: number, width: number, height: number) => void> =
      [];
    View.prototype.measureInWindow = callback => {
      pendingMeasures.push(callback);
    };

    const { user } = renderCenter();
    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    await waitForChecks();
    expect(pendingMeasures.length).toBeGreaterThan(0);

    await user.press(screen.getByText("Leave notification centre"));
    expect(await screen.findByText("Back to notifications")).toBeOnTheScreen();

    act(() => {
      pendingMeasures.splice(0).forEach(callback => callback(0, 0, 120, 120));
    });
    expect(callsFor("container_impression")).toEqual([]);

    await waitForChecks();
    expect(pendingMeasures).toHaveLength(0);

    await user.press(screen.getByText("Back to notifications"));
    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    await waitForChecks();
    act(() => {
      pendingMeasures.splice(0).forEach(callback => callback(0, 0, 120, 120));
    });
    expect(callsFor("container_impression")).toEqual([
      ["container_impression", containerImpressionPayload],
    ]);
  });
});
