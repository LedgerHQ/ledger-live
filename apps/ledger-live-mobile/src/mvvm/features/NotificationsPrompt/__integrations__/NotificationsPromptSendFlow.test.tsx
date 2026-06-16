import React from "react";
import { View } from "react-native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { AB_TESTING_VARIANTS } from "../types/variants";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
  act,
} from "@tests/test-renderer";
import storage from "LLM/storage";
import SendFundsNavigator from "~/components/RootNavigator/SendFundsNavigator";
import { NavigatorName, ScreenName } from "~/const";
import GlobalDrawers from "~/GlobalDrawers";
import { track } from "~/analytics";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import {
  createNotificationsPromptFeatureFlags,
  transactionsAlertsDrawerPromptCategoryConfig,
} from "../testUtils";

type AuthorizationStatusType = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const mockRequestPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.NOT_DETERMINED),
);
const mockHasPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.NOT_DETERMINED),
);

jest.mock("@react-native-firebase/messaging", () => {
  const AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  } as const;

  return {
    AuthorizationStatus,
    getMessaging: jest.fn(() => ({
      requestPermission: mockRequestPermission,
      hasPermission: mockHasPermission,
    })),
  };
});

const featureFlagsForSendPrompt = createNotificationsPromptFeatureFlags();
const featureFlagsForTransactionsAlertsSendPrompt = createNotificationsPromptFeatureFlags({
  notificationsCategories: [transactionsAlertsDrawerPromptCategoryConfig],
});

describe("NotificationsPrompt send flow", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    mockRequestPermission.mockResolvedValue(AuthorizationStatus.NOT_DETERMINED);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.NOT_DETERMINED);
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const Stack = createNativeStackNavigator();

  const HOME_SCREEN = "Home";

  function HomeScreen() {
    return <View />;
  }

  const MOCK_ACCOUNT = MockedAccounts.active[0];
  const sendFlowNavigationState = {
    index: 1,
    routes: [
      {
        name: HOME_SCREEN,
      },
      {
        name: NavigatorName.SendFunds,
        state: {
          index: 0,
          routes: [
            {
              name: ScreenName.SendValidationSuccess,
              params: {
                accountId: MOCK_ACCOUNT.id,
                deviceId: "device-id",
                result: {
                  id: "op-123",
                  hash: "0x123abc",
                  type: "OUT",
                  accountId: MOCK_ACCOUNT.id,
                },
                transaction: { family: MOCK_ACCOUNT.currency.family },
              },
            },
          ],
        },
      },
    ],
  };

  function SendFlowTestApp() {
    return (
      <GlobalDrawers>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
          <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsNavigator} />
        </Stack.Navigator>
      </GlobalDrawers>
    );
  }

  it("should prompt the notifications drawer when leaving the send success screen", async () => {
    const { user } = renderWithReactQuery(<SendFlowTestApp />, {
      navigationInitialState: sendFlowNavigationState,
      overrideInitialState: withFlagOverrides(featureFlagsForSendPrompt, state => ({
        ...state,
        accounts: MockedAccounts,
        notifications: {
          ...state.notifications,
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        },
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          notifications: {
            ...state.settings.notifications,
            areNotificationsAllowed: true,
          },
        },
      })),
    });

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible());
    const closeButton = screen.getByTestId("enabled-success-close-button");
    expect(track).not.toHaveBeenCalledWith(
      "attempt_to_trigger_push_notification_drawer_after_action",
    );

    await user.press(closeButton);
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.getByText(/allow notifications/i)).toBeVisible();
    });
    expect(track).toHaveBeenCalledWith("attempt_to_trigger_push_notification_drawer_after_action", {
      action: "send",
      shouldPrompt: true,
      variant: AB_TESTING_VARIANTS.B,
      repromptDelay: null,
      dismissedCount: 0,
      skipReason: undefined,
      drawerPromptTarget: "globalPushNotifications",
    });

    const maybeLaterButton = screen.getByText(/maybe later/i);
    expect(maybeLaterButton).toBeVisible();
    await user.press(maybeLaterButton);

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "maybe later",
      page: "Drawer push notification opt-in",
      source: "send",
      drawerPromptTarget: "globalPushNotifications",
      repromptDelay: null,
      dismissedCount: 0,
      variant: AB_TESTING_VARIANTS.B,
    });
  });

  it("should prompt the transaction alerts drawer when a globally opted-in user leaves the send success screen", async () => {
    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    const { user } = renderWithReactQuery(<SendFlowTestApp />, {
      navigationInitialState: sendFlowNavigationState,
      overrideInitialState: withFlagOverrides(
        featureFlagsForTransactionsAlertsSendPrompt,
        state => ({
          ...state,
          accounts: MockedAccounts,
          notifications: {
            ...state.notifications,
            permissionStatus: AuthorizationStatus.AUTHORIZED,
          },
          settings: {
            ...state.settings,
            readOnlyModeEnabled: false,
            notifications: {
              ...state.settings.notifications,
              areNotificationsAllowed: true,
              transactionsAlertsCategory: false,
            },
          },
        }),
      ),
    });

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible());

    await user.press(screen.getByTestId("enabled-success-close-button"));
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.getByText(/know the status of your money/i)).toBeVisible();
    });
    expect(
      screen.getByText(/real-time alerts when your crypto is sent or received/i),
    ).toBeVisible();
    expect(screen.queryByText(/don't miss what matters/i)).not.toBeOnTheScreen();
    expect(screen.getByText(/allow notifications/i)).toBeVisible();
  });
});
