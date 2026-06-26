import React from "react";
import { Pressable, Text, View } from "react-native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  act,
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
} from "@tests/test-renderer";
import storage from "LLM/storage";
import { track } from "~/analytics";
import GlobalDrawers from "~/GlobalDrawers";
import WebPlatformPlayer from "~/components/WebPlatformPlayer";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import { createNotificationsPromptFeatureFlags } from "../testUtils";

jest.mock("~/analytics", () => {
  const track = jest.fn();

  return {
    track,
    useTrack: () => track,
    TrackScreen: () => null,
    updateIdentify: jest.fn(),
  };
});

// Mock WebView as View to avoid native setup in this dApp flow test.
jest.mock("react-native-webview", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");

  const WebView = React.forwardRef((props: { testID?: string }, ref: React.Ref<unknown>) => (
    <View {...props} ref={ref} />
  ));

  return {
    __esModule: true,
    default: WebView,
    WebView,
  };
});

let callTransactionBroadcast: (() => void) | undefined;
// Capture WalletAPI transaction.broadcast so the test can trigger dApp completion directly.
jest.mock("@ledgerhq/live-common/wallet-api/react", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/wallet-api/react");

  return {
    ...actual,
    useWalletAPIServer: jest.fn(
      ({ uiHook }: { uiHook: { "transaction.broadcast": () => void } }) => {
        callTransactionBroadcast = uiHook["transaction.broadcast"];

        return {
          onMessage: jest.fn(),
          onLoadError: jest.fn(),
          server: undefined,
        };
      },
    ),
  };
});

type DAppCompleteStackParamList = {
  Home: undefined;
  DApp: undefined;
};

const Stack = createNativeStackNavigator<DAppCompleteStackParamList>();

function HomeScreen() {
  return <View testID="home-screen" />;
}

function DAppScreen({ navigation }: NativeStackScreenProps<DAppCompleteStackParamList, "DApp">) {
  return (
    <View>
      <WebPlatformPlayer
        manifest={{
          id: "test-dapp",
          name: "Test dApp",
          private: false,
          url: "https://example.com",
          homepageUrl: "https://example.com",
          icon: "",
          platforms: ["ios", "android"],
          providerTestBaseUrl: "",
          providerTestId: "",
          apiVersion: "^2.0.0",
          manifestVersion: "2",
          branch: "stable",
          categories: [],
          currencies: "*",
          content: {
            shortDescription: { en: "Test" },
            description: { en: "Test" },
          },
          permissions: [],
          domains: ["https://example.com"],
          visibility: "complete",
        }}
      />
      <Pressable onPress={() => navigation.goBack()}>
        <Text>Leave dApp</Text>
      </Pressable>
    </View>
  );
}

function DAppCompleteFlowTestApp() {
  return (
    <GlobalDrawers>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DApp" component={DAppScreen} />
      </Stack.Navigator>
    </GlobalDrawers>
  );
}

const dAppNavigationState = {
  index: 1,
  routes: [
    {
      name: "Home",
    },
    {
      name: "DApp",
    },
  ],
};

describe("NotificationsPrompt dApp complete flow", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    callTransactionBroadcast = undefined;
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  const renderDAppCompleteFlow = () =>
    renderWithReactQuery(<DAppCompleteFlowTestApp />, {
      navigationInitialState: dAppNavigationState,
      overrideInitialState: withFlagOverrides(createNotificationsPromptFeatureFlags(), state => ({
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
  it("should not show the drawer when transaction broadcast is called but user remains on the dApp", async () => {
    renderDAppCompleteFlow();

    await waitFor(() => {
      expect(callTransactionBroadcast).toEqual(expect.any(Function));
    });
    const webview = await screen.findByTestId("wallet-api-webview");
    expect(webview).toBeVisible();

    act(() => {
      callTransactionBroadcast?.();
      jest.runOnlyPendingTimers();
    });

    act(() => {
      const ONE_MINUTE_IN_MS = 60 * 1000;
      jest.advanceTimersByTime(ONE_MINUTE_IN_MS);
    });

    expect(webview).toBeVisible();
    expect(screen.queryByText(/allow notifications/i)).toBeNull();
    expect(track).not.toHaveBeenCalledWith(
      "attempt_to_trigger_push_notification_drawer_after_action",
      expect.objectContaining({ action: "dapp_complete" }),
    );
  });

  it("should prompt the notifications drawer after WalletAPI transaction.broadcast and leaving the dApp", async () => {
    const { user } = renderDAppCompleteFlow();

    await waitFor(() => {
      expect(screen.getByTestId("wallet-api-webview")).toBeVisible();
      expect(callTransactionBroadcast).toEqual(expect.any(Function));
    });
    act(() => {
      callTransactionBroadcast?.();
    });
    expect(track).not.toHaveBeenCalledWith(
      "attempt_to_trigger_push_notification_drawer_after_action",
      expect.objectContaining({ action: "dapp_complete" }),
    );

    await user.press(screen.getByText("Leave dApp"));
    await waitFor(() => {
      expect(screen.getByTestId("home-screen")).toBeVisible();
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(screen.getByText(/allow notifications/i)).toBeVisible();
    });
    expect(track).toHaveBeenCalledWith("attempt_to_trigger_push_notification_drawer_after_action", {
      action: "dapp_complete",
      shouldPrompt: true,
      repromptDelay: null,
      dismissedCount: 0,
      skipReason: undefined,
      drawerPromptTarget: "globalPushNotifications",
    });
  });

  it("should not prompt the notifications drawer when leaving without a completed dApp transaction", async () => {
    const { user } = renderDAppCompleteFlow();

    await waitFor(() => {
      expect(screen.getByTestId("wallet-api-webview")).toBeVisible();
      expect(callTransactionBroadcast).toEqual(expect.any(Function));
    });
    await user.press(screen.getByText("Leave dApp"));
    await waitFor(() => {
      expect(screen.getByTestId("home-screen")).toBeVisible();
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.queryByText(/allow notifications/i)).toBeNull();
    expect(track).not.toHaveBeenCalledWith(
      "attempt_to_trigger_push_notification_drawer_after_action",
      expect.objectContaining({ action: "dapp_complete" }),
    );
  });
});
