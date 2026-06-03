import React from "react";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import NotificationsOptIn from "..";
import { NavigatorName } from "~/const";

const mockMessaging = getMessaging();
const mockHasPermission = jest.mocked(mockMessaging.hasPermission);
const mockRequestPermission = jest.mocked(mockMessaging.requestPermission);
const mockedGetMessaging = jest.mocked(getMessaging);
const Stack = createNativeStackNavigator();

function EntryScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  return (
    <Pressable onPress={() => navigation.navigate("NotificationsOptIn")}>
      <Text>Previous onboarding screen</Text>
    </Pressable>
  );
}

function BaseScreen({ route }: { route: { params?: { screen?: string } } }) {
  return (
    <Text>
      {route.params?.screen === NavigatorName.Settings
        ? "Notifications settings route"
        : "Portfolio route"}
    </Text>
  );
}

function TestNavigator({ initialRouteName = "NotificationsOptIn" }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Previous" component={EntryScreen} />
      <Stack.Screen name="NotificationsOptIn" component={NotificationsOptIn} />
      <Stack.Screen name={NavigatorName.Base} component={BaseScreen} />
    </Stack.Navigator>
  );
}

describe("NotificationsOptIn", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await storage.deleteAll();
    mockedGetMessaging.mockReturnValue(mockMessaging);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.NOT_DETERMINED);
    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
  });

  it("should render the notifications opt-in screen when permission is not determined", async () => {
    render(<TestNavigator />);

    expect(await screen.findByText("Enable notifications?")).toBeVisible();
    expect(screen.getByText("Allow notifications")).toBeVisible();
    expect(screen.getByText("Maybe later")).toBeVisible();
    expect(screen.getByTestId("notifications-opt-in-illustration")).toBeVisible();
  });

  it("should request OS permission and complete lazy onboarding when allowing notifications", async () => {
    const { user } = render(<TestNavigator />);

    await waitFor(() => expect(mockHasPermission).toHaveBeenCalled());
    await user.press(screen.getByText("Allow notifications"));

    await waitFor(() => expect(mockRequestPermission).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Portfolio route")).toBeVisible();
  });

  it("should complete lazy onboarding to notification settings when app notifications are disabled", async () => {
    const { user } = render(<TestNavigator />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          notifications: {
            ...state.settings.notifications,
            areNotificationsAllowed: false,
          },
        },
      }),
    });

    await waitFor(() => expect(mockHasPermission).toHaveBeenCalled());
    await user.press(screen.getByText("Allow notifications"));

    expect(await screen.findByText("Notifications settings route")).toBeVisible();
  });

  it("should go back when pressing the back button", async () => {
    const { user } = render(<TestNavigator initialRouteName="Previous" />);

    await user.press(screen.getByText("Previous onboarding screen"));
    await screen.findByText("Enable notifications?");
    await user.press(screen.getByLabelText("Back"));

    expect(await screen.findByText("Previous onboarding screen")).toBeVisible();
  });

  it("should opt out and complete lazy onboarding when choosing maybe later", async () => {
    const { user } = render(<TestNavigator />);

    await screen.findByText("Enable notifications?");
    await user.press(screen.getByText("Maybe later"));

    expect(await screen.findByText("Portfolio route")).toBeVisible();
  });

  it("should skip the opt-in screen when notifications are already enabled", async () => {
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    render(<TestNavigator />);

    expect(await screen.findByText("Portfolio route")).toBeVisible();
    expect(screen.queryByText("Notifications are already enabled")).not.toBeOnTheScreen();
  });

  it("should show an error state when permission status cannot be loaded", async () => {
    mockHasPermission.mockRejectedValue(new Error("permission unavailable"));

    render(<TestNavigator />);

    expect(await screen.findByText("Notifications are unavailable")).toBeVisible();
    expect(screen.queryByTestId("notifications-opt-in-illustration")).not.toBeOnTheScreen();
    expect(screen.getByText("Continue")).toBeVisible();
  });
});
