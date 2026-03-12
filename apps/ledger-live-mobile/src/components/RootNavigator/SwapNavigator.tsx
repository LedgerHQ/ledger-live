import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import {
  createNativeStackNavigator,
  NativeStackHeaderRightProps,
} from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import SwapHistory from "~/screens/Swap/History";
import Touchable from "../Touchable";

import { useTheme } from "styled-components/native";
import { useTrack } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { OperationDetails, PendingOperation, SwapLoading } from "~/screens/Swap/index";
import { SwapLiveApp } from "~/screens/Swap/LiveApp";
import { SwapLiveAppWallet40 } from "~/screens/Swap/LiveApp/SwapLiveAppWallet40";
import { SWAP_VERSION } from "~/screens/Swap/utils";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "./types/helpers";
import { SwapNavigatorParamList } from "./types/SwapNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import SwapCustomError from "~/screens/Swap/SubScreens/SwapCustomError";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

// Constants for tracking sources
const TRACKING_SOURCES = {
  Accounts: "Account",
  Main: "Portfolio",
  MarketDetail: "Assets",
};

// Helper function to determine tracking source based on route name
const getTrackingSource = (routeName: string) => {
  return Object.entries(TRACKING_SOURCES).find(([key]) => routeName.startsWith(key))?.[1];
};

const Stack = createNativeStackNavigator<SwapNavigatorParamList>();

const NullHeader = () => null;

function BackButton() {
  return <NavigationHeaderBackButton />;
}

function SwapHistoryHeaderRight({
  onPress,
}: Readonly<{
  onPress: () => void;
}>) {
  return (
    <Flex p={6}>
      <Touchable touchableTestID="NavigationHeaderSwapHistory" onPress={onPress}>
        <Icons.Clock color={"neutral.c100"} />
      </Touchable>
    </Flex>
  );
}

function createSwapHistoryHeaderRight(onPress: () => void) {
  return function SwapHistoryHeaderRightRenderer(
    _props: Readonly<NativeStackHeaderRightProps>,
  ): React.JSX.Element {
    return <SwapHistoryHeaderRight onPress={onPress} />;
  };
}

function getInitialSwapTabParams(
  swapParams: BaseNavigatorStackParamList[NavigatorName.Swap] | undefined,
): Partial<SwapNavigatorParamList[ScreenName.SwapTab]> | undefined {
  if (!swapParams || swapParams.screen !== ScreenName.SwapTab) return undefined;

  return swapParams.params;
}

export default function SwapNavigator(
  props: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.Swap> | undefined,
) {
  const initialSwapParams = getInitialSwapTabParams(props?.route?.params);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const track = useTrack();
  const navigation = useNavigation<StackNavigatorNavigation<SwapNavigatorParamList>>();
  const { isEnabled: isLwm40Enabled, shouldDisplayWallet40MainNav } =
    useWalletFeaturesConfig("mobile");

  const goToSwapHistory = useCallback(() => {
    track("button_clicked", {
      button: "SwapHistory",
      page: ScreenName.SwapTab,
      swapVersion: SWAP_VERSION,
    });

    navigation.navigate(ScreenName.SwapHistory);
  }, [navigation, track]);

  // Helper function to track button click
  const trackButtonClick = useCallback(
    (source: string) => {
      track("button_clicked", {
        button: "swap",
        source,
        flow: "swap",
        swapVersion: SWAP_VERSION,
      });
    },
    [track],
  );

  useEffect(() => {
    const parentNavigator = navigation.getParent();
    const navigationState = parentNavigator?.getState();

    if (!navigationState?.index || navigationState.index <= 0) {
      return;
    }

    const previousRoute = navigationState.routes[navigationState.index - 1];
    if (!previousRoute?.name) {
      return;
    }

    const source = getTrackingSource(previousRoute.name);
    if (source) {
      trackButtonClick(source);
    }
  }, [trackButtonClick, navigation]);

  // Old design header options
  const oldDesignOptions = useMemo(
    () => ({
      ...("options" in noNanoBuyNanoWallScreenOptions
        ? noNanoBuyNanoWallScreenOptions.options
        : {}),
      headerTitle: t("transfer.swap2.form.title"),
      headerLeft: BackButton,
      headerRight: createSwapHistoryHeaderRight(goToSwapHistory),
    }),
    [goToSwapHistory, noNanoBuyNanoWallScreenOptions, t],
  );

  const shouldDisplayHeader = !shouldDisplayWallet40MainNav;
  // Wallet 4.0 design: header is handled by MainNavigator tab, hide it here
  const wallet40Options = useMemo(
    () => ({
      ...("options" in noNanoBuyNanoWallScreenOptions
        ? noNanoBuyNanoWallScreenOptions.options
        : {}),
      headerShown: false,
    }),
    [noNanoBuyNanoWallScreenOptions],
  );

  const swapComponent = isLwm40Enabled ? SwapLiveAppWallet40 : SwapLiveApp;
  const swapOptions = isLwm40Enabled ? wallet40Options : oldDesignOptions;

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: shouldDisplayHeader }}>
      <Stack.Screen
        name={ScreenName.SwapTab}
        component={swapComponent}
        {...noNanoBuyNanoWallScreenOptions}
        options={swapOptions}
        initialParams={initialSwapParams}
      />

      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: NullHeader,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={OperationDetails}
        options={{
          headerTitle: t("transfer.swap2.history.title"),
          headerLeft: BackButton,
          headerRight: NullHeader,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapCustomError}
        component={SwapCustomError}
        options={{
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapLoading}
        component={SwapLoading}
        options={{
          headerShown: false,
          headerLeft: NullHeader, // Prevent going back while loading
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapHistory}
        component={SwapHistory}
        options={{
          headerTitle: t("transfer.swap2.history.title"),
          headerRight: NullHeader,
        }}
      />
    </Stack.Navigator>
  );
}
