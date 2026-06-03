import React, { useEffect } from "react";
import { View } from "react-native";
import BigNumber from "bignumber.js";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { AB_TESTING_VARIANTS } from "./types/variants";
import { CommonActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import { createNotificationsPromptFeatureFlags } from "./testUtils";

jest.mock("~/analytics", () => {
  const track = jest.fn();

  return {
    track,
    useTrack: () => track,
    TrackScreen: () => null,
    updateIdentify: jest.fn(),
  };
});

// Exception: this test only needs native beforeRemove behavior; real SwapLiveApp
// would boot the webview and require unrelated manifest/webview setup.
jest.mock("~/screens/Swap/LiveApp", () => ({
  SwapLiveApp: () => null,
}));

jest.mock("~/screens/Swap/LiveApp/SwapLiveAppWallet40", () => ({
  SwapLiveAppWallet40: () => null,
}));

const featureFlagsForSwapPrompt = createNotificationsPromptFeatureFlags();

describe("NotificationsPrompt swap flow", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const Stack = createNativeStackNavigator<{
    [NavigatorName.Main]: undefined;
    [NavigatorName.Swap]: BaseNavigatorStackParamList[NavigatorName.Swap];
    [NavigatorName.SwapSubScreens]: BaseNavigatorStackParamList[NavigatorName.SwapSubScreens];
  }>();
  type SwapRedirectParams = NonNullable<BaseNavigatorStackParamList[NavigatorName.SwapSubScreens]>;
  type LegacySwapRedirectParams = NonNullable<BaseNavigatorStackParamList[NavigatorName.Swap]>;

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

  const legacySwapSuccessParams: LegacySwapRedirectParams = {
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
        { overrideInitialState: overrideSwapPromptInitialState },
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
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          variant: AB_TESTING_VARIANTS.B,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
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
        repromptDelay: null,
        dismissedCount: 0,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("should prompt only after closing history when swap success opens history", async () => {
      const { user } = renderWalletV4SwapFlow(swapSuccessParams);

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

      await user.press(screen.getAllByTestId("navigation-header-back-button")[0]);
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          variant: AB_TESTING_VARIANTS.B,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
        },
      );

      await user.press(screen.getByText(/allow notifications/i));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "allow notifications",
        page: "Drawer push notification opt-in",
        source: "swap",
        repromptDelay: null,
        dismissedCount: 0,
        variant: AB_TESTING_VARIANTS.B,
      });
    });
  });

  describe("legacy", () => {
    function LegacyHomeScreen({ swapParams }: { swapParams: LegacySwapRedirectParams }) {
      const navigation = useNavigation<NavigationProp<BaseNavigatorStackParamList>>();

      // Keep a parent stack entry under the legacy swap flow so the success screen can go back.
      useEffect(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: NavigatorName.Swap,
            params: swapParams,
          }),
        );
      }, [navigation, swapParams]);

      return <View />;
    }

    function renderLegacySwapFlow(swapParams: LegacySwapRedirectParams) {
      return render(
        <SwapFlowTestWrapper>
          <LegacyHomeScreen swapParams={swapParams} />
        </SwapFlowTestWrapper>,
        { overrideInitialState: overrideSwapPromptInitialState },
      );
    }

    it("should prompt the notifications drawer when closing the swap success screen", async () => {
      const { user } = renderLegacySwapFlow(legacySwapSuccessParams);

      await waitFor(() => expect(screen.getByTestId("swap-success-title")).toBeVisible());
      expect(screen.getAllByTestId("NavigationHeaderCloseButton")[0]).toBeVisible();
      expect(track).not.toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        expect.any(Object),
      );

      await user.press(screen.getAllByTestId("NavigationHeaderCloseButton")[0]);
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          variant: AB_TESTING_VARIANTS.B,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
        },
      );
      await user.press(screen.getByText(/allow notifications/i));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "allow notifications",
        page: "Drawer push notification opt-in",
        source: "swap",
        repromptDelay: null,
        dismissedCount: 0,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("should wait for swap history to close when swap success continues to history", async () => {
      const { user } = renderLegacySwapFlow(legacySwapSuccessParams);

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

      await user.press(screen.getAllByTestId("navigation-header-back-button")[0]);
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      expect(track).toHaveBeenCalledWith(
        "attempt_to_trigger_push_notification_drawer_after_action",
        {
          action: "swap",
          shouldPrompt: true,
          variant: AB_TESTING_VARIANTS.B,
          repromptDelay: null,
          dismissedCount: 0,
          skipReason: undefined,
        },
      );

      await user.press(screen.getByText(/maybe later/i));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "maybe later",
        page: "Drawer push notification opt-in",
        source: "swap",
        repromptDelay: null,
        dismissedCount: 0,
        variant: AB_TESTING_VARIANTS.B,
      });
    });
  });
});
