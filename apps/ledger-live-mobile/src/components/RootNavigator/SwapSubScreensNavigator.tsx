import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import SwapHistory from "~/screens/Swap/History";
import { OperationDetails, PendingOperation, SwapLoading } from "~/screens/Swap/index";
import SwapCustomError from "~/screens/Swap/SubScreens/SwapCustomError";
import { SwapSubScreensNavigatorParamList } from "./types/SwapSubScreensNavigator";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { navigateBackToSwapTab } from "~/screens/Swap/navigation/navigateBackToSwapTab";

const Stack = createNativeStackNavigator<SwapSubScreensNavigatorParamList>();

const NullHeader = () => null;

function BackButton() {
  return <NavigationHeaderBackButton />;
}

function SwapHistoryBackButton({
  shouldDisplayWallet40MainNav,
}: {
  shouldDisplayWallet40MainNav: boolean;
}) {
  return (
    <NavigationHeaderBackButton
      onPress={navigation =>
        navigateBackToSwapTab({
          navigation,
          shouldDisplayWallet40MainNav,
        })
      }
    />
  );
}

function getSwapHistoryScreenOptions({
  headerTitle,
  shouldDisplayWallet40MainNav,
}: {
  headerTitle: string;
  shouldDisplayWallet40MainNav: boolean;
}) {
  return {
    headerTitle,
    headerLeft: () => (
      <SwapHistoryBackButton shouldDisplayWallet40MainNav={shouldDisplayWallet40MainNav} />
    ),
    headerRight: NullHeader,
  };
}

/**
 * Navigator containing all native Swap sub-screens (History, PendingOperation,
 * OperationDetails, Loading, CustomError).
 *
 * Registered as a single entry in BaseNavigator so that navigating to any
 * sub-screen pushes on top of MainNavigator, hiding the tab bar.
 * This follows the same pattern as the Earn live-app sub-flows.
 */
export default function SwapSubScreensNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: true }}>
      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: NullHeader,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapHistory}
        component={SwapHistory}
        options={getSwapHistoryScreenOptions({
          headerTitle: t("transfer.swap2.history.title"),
          shouldDisplayWallet40MainNav,
        })}
      />
      <Stack.Screen
        name={ScreenName.SwapLoading}
        component={SwapLoading}
        options={{
          headerShown: false,
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
        name={ScreenName.SwapOperationDetails}
        component={OperationDetails}
        options={{
          headerTitle: t("transfer.swap2.history.title"),
          headerLeft: BackButton,
          headerRight: NullHeader,
        }}
      />
    </Stack.Navigator>
  );
}
