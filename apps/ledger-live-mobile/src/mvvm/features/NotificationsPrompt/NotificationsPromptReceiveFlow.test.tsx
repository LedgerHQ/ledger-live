import React from "react";
import { View } from "react-native";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
  act,
} from "@tests/test-renderer";
import storage from "LLM/storage";
import ReceiveFundsNavigator from "~/components/RootNavigator/ReceiveFundsNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { BTC_ACCOUNT } from "@ledgerhq/live-common/modularDrawer/__mocks__/accounts.mock";
import GlobalDrawers from "~/GlobalDrawers";
import { track } from "~/analytics";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { createNotificationsPromptFeatureFlags } from "./testUtils";

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

const featureFlagsForReceivePrompt = createNotificationsPromptFeatureFlags();

describe("NotificationsPrompt receive flow", () => {
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

  const receiveFlowNavigationState = {
    index: 1,
    routes: [
      {
        name: HOME_SCREEN,
      },
      {
        name: NavigatorName.ReceiveFunds,
        state: {
          index: 0,
          routes: [
            {
              name: ScreenName.ReceiveConnectDevice,
              params: {
                accountId: BTC_ACCOUNT.id,
              },
            },
          ],
        },
      },
    ],
  };

  function ReceiveFlowTestApp() {
    return (
      <GlobalDrawers>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
          <Stack.Screen name={NavigatorName.ReceiveFunds} component={ReceiveFundsNavigator} />
        </Stack.Navigator>
      </GlobalDrawers>
    );
  }

  it("should prompt the notifications drawer when leaving the receive flow", async () => {
    const { user } = renderWithReactQuery(<ReceiveFlowTestApp />, {
      navigationInitialState: receiveFlowNavigationState,
      overrideInitialState: withFlagOverrides(featureFlagsForReceivePrompt, state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [BTC_ACCOUNT],
        },
        notifications: {
          ...state.notifications,
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        },
        settings: {
          ...state.settings,
          readOnlyModeEnabled: true,
          notifications: {
            ...state.settings.notifications,
            areNotificationsAllowed: true,
          },
        },
      })),
    });

    await user.press(await screen.findByText(/^continue$/i));
    await waitFor(() => expect(screen.getByTestId("button-receive-confirmation")).toBeVisible());

    const backButtons = screen.getAllByTestId("navigation-header-back-button");
    await user.press(backButtons[backButtons.length - 1]);
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    await waitFor(() => {
      expect(screen.getByText(/maybe later/i)).toBeVisible();
    });
    expect(track).toHaveBeenCalledWith("attempt_to_trigger_push_notification_drawer_after_action", {
      action: "receive",
      shouldPrompt: true,
      variant: ABTestingVariants.variantB,
      repromptDelay: null,
      dismissedCount: 0,
      skipReason: undefined,
    });
    const allowNotificationsButton = screen.getByText(/allow notifications/i);
    expect(allowNotificationsButton).toBeVisible();
    await user.press(allowNotificationsButton);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "allow notifications",
      page: "Drawer push notification opt-in",
      source: "receive",
      repromptDelay: null,
      dismissedCount: 0,
      variant: ABTestingVariants.variantB,
    });
  });
});
