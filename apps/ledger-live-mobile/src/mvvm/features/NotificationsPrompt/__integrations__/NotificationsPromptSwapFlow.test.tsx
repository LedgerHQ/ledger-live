import React, { useEffect } from "react";
import { View } from "react-native";
import BigNumber from "bignumber.js";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { CommonActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getTransactionStatus } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import {
  act,
  renderWithReactQuery as render,
  screen,
  waitFor,
  withFlagOverrides,
} from "@tests/test-renderer";
import storage from "LLM/storage";
import SwapNavigator from "~/components/RootNavigator/SwapNavigator";
import SwapSubScreensNavigator from "~/components/RootNavigator/SwapSubScreensNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import GlobalDrawers from "~/GlobalDrawers";
import { track } from "~/analytics";
import { closeSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
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

// Exception: this test only needs native beforeRemove behavior; real SwapLiveAppWallet40
// would boot the webview and require unrelated manifest/webview setup.
jest.mock("~/screens/Swap/LiveApp/SwapLiveAppWallet40", () => ({
  SwapLiveAppWallet40: () => null,
}));
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index", () => ({
  getTransactionStatus: jest.fn(),
}));

// This test verifies the notification opt-in drawer, not the swap transaction status
// drawer. The two share a single QueuedDrawer queue, and the real status drawer can't
// complete its close lifecycle in tests — the @gorhom/bottom-sheet mock never fires
// onDismiss — so it would hold the queue slot and the opt-in drawer could never mount.
// Stub it so it never occupies the queue; its open/closed state is driven directly via
// redux below, and its own behaviour is covered by the SwapTransactionStatus tests.
jest.mock("LLM/features/SwapTransactionStatus", () => {
  const actual = jest.requireActual("LLM/features/SwapTransactionStatus");
  return { ...actual, SwapTransactionStatusDrawerWrapper: () => null };
});

const featureFlagsForSwapPrompt = createNotificationsPromptFeatureFlags();
const mockedGetTransactionStatus = jest.mocked(getTransactionStatus);

describe("NotificationsPrompt swap flow", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    mockedGetTransactionStatus.mockResolvedValue({
      provider: "changelly",
      swapId: swapOperation.swapId,
      status: "finished",
      fromAccountId: MockedAccounts.active[0].id,
      toAccountId: MockedAccounts.active[0].id,
      sentAmount: swapOperation.fromAmount.toString(),
      receivedAmount: swapOperation.toAmount.toString(),
    });
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  const Stack = createNativeStackNavigator<{
    [NavigatorName.Main]: undefined;
    [NavigatorName.Swap]: BaseNavigatorStackParamList[NavigatorName.Swap];
    [NavigatorName.SwapSubScreens]: BaseNavigatorStackParamList[NavigatorName.SwapSubScreens];
  }>();
  type SwapRedirectParams = NonNullable<BaseNavigatorStackParamList[NavigatorName.SwapSubScreens]>;

  const swapOperation = {
    swapId: "swap-123",
    provider: "changelly",
    status: "pending",
    receiverAccountId: MockedAccounts.active[0].id,
    operationId: "operation-123",
    fromAmount: new BigNumber(1),
    toAmount: new BigNumber(1),
  };

  const swapSuccessParams: SwapRedirectParams = {
    screen: ScreenName.SwapPendingOperation,
    params: {
      swapOperation,
    },
  };

  const overrideSwapPromptInitialState = withFlagOverrides(featureFlagsForSwapPrompt, state => ({
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
  }));

  function SwapFlowTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <GlobalDrawers>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={NavigatorName.Main}>{() => children}</Stack.Screen>
          <Stack.Screen name={NavigatorName.SwapSubScreens} component={SwapSubScreensNavigator} />
          <Stack.Screen name={NavigatorName.Swap} component={SwapNavigator} />
        </Stack.Navigator>
      </GlobalDrawers>
    );
  }

  describe("Wallet V4", () => {
    function HomeScreen({ swapParams }: { swapParams: SwapRedirectParams }) {
      const navigation = useNavigation<NavigationProp<BaseNavigatorStackParamList>>();

      // Keep a parent stack entry under the swap flow so the success screen can go back.
      useEffect(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: NavigatorName.SwapSubScreens,
            params: swapParams,
          }),
        );
      }, [navigation, swapParams]);

      return <View />;
    }

    function renderWalletV4SwapFlow(swapParams: SwapRedirectParams) {
      return render(
        <SwapFlowTestWrapper>
          <HomeScreen swapParams={swapParams} />
        </SwapFlowTestWrapper>,
        {
          overrideInitialState: overrideSwapPromptInitialState,
          userEventOptions: {
            advanceTimers: delay => jest.advanceTimersByTime(delay),
          },
        },
      );
    }

    it("should prompt the notifications drawer after closing swap success", async () => {
      const { user } = renderWalletV4SwapFlow(swapSuccessParams);

      await waitFor(() => expect(screen.getByTestId("swap-success-title")).toBeVisible());
      expect(screen.getAllByTestId("NavigationHeaderCloseButton")[0]).toBeVisible();
      expect(track).not.toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        expect.any(Object),
      );

      await user.press(screen.getAllByTestId("NavigationHeaderCloseButton")[0]);
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
          drawerPromptTarget: "globalPushNotifications",
        },
      );
      await waitFor(() => {
        expect(screen.getByText(/allow notifications/i)).toBeVisible();
      });

      await user.press(screen.getByText(/allow notifications/i));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "allow notifications",
        page: "Drawer push notification opt-in",
        source: "swap",
        drawerPromptTarget: "globalPushNotifications",
        repromptDelay: null,
        dismissedCount: 0,
      });
    });

    it("should prompt notifications drawer after closing transaction status and leaving history", async () => {
      const { user, store } = renderWalletV4SwapFlow(swapSuccessParams);

      await waitFor(() => expect(screen.getByTestId("swap-success-title")).toBeVisible());
      expect(track).not.toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
      );

      await user.press(screen.getByText(/go to history/i));
      await waitFor(() => {
        expect(screen.getByText(/your previous swaps will appear here/i)).toBeVisible();
      });
      expect(track).not.toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
      );
      expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(true);
      expect(screen.queryByText(/allow notifications/i)).toBeNull();

      // Dismiss the status drawer via state — this test doesn't exercise its UI. Closing it
      // before leaving history mirrors the real flow (the prompt surfaces only afterwards).
      act(() => {
        store.dispatch(closeSwapTransactionStatusDrawer());
      });
      expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
      expect(screen.queryByText(/allow notifications/i)).toBeNull();

      await user.press(screen.getAllByTestId("navigation-header-back-button")[0]);
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
          drawerPromptTarget: "globalPushNotifications",
        },
      );

      expect(store.getState().notifications.isPushNotificationsModalOpen).toBe(true);
      await waitFor(() => {
        expect(screen.getByText(/allow notifications/i)).toBeVisible();
      });

      await user.press(screen.getByText(/allow notifications/i));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "allow notifications",
        page: "Drawer push notification opt-in",
        source: "swap",
        drawerPromptTarget: "globalPushNotifications",
        repromptDelay: null,
        dismissedCount: 0,
      });
    });
  });
});
