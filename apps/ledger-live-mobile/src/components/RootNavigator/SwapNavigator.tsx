import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import SwapHistory from "~/screens/Swap/History";
import Touchable from "../Touchable";

import { useTheme } from "styled-components/native";
import { useTrack } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import {
  OperationDetails,
  PendingOperation,
  SelectAccount,
  SelectCurrency,
  SelectFees,
  SelectProvider,
  SwapLoading,
} from "~/screens/Swap/index";
import { SwapLiveApp } from "~/screens/Swap/LiveApp";
import { SWAP_VERSION } from "~/screens/Swap/utils";
import StepHeader from "../StepHeader";
import SwapFormNavigator from "./SwapFormNavigator";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "./types/helpers";
import { SwapFormNavigatorParamList } from "./types/SwapFormNavigator";
import { SwapNavigatorParamList } from "./types/SwapNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import SwapCustomError from "~/screens/Swap/SubScreens/SwapCustomError";

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

export default function SwapNavigator(
  props: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.Swap> | undefined,
) {
  const params = props?.route?.params?.params || {};
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const track = useTrack();
  const navigation = useNavigation<StackNavigatorNavigation<SwapFormNavigatorParamList>>();

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

  const ptxSwapLiveAppMobile = useFeature("ptxSwapLiveAppMobile");

  const options = useMemo(() => {
    return !ptxSwapLiveAppMobile?.enabled
      ? {
          ...("options" in noNanoBuyNanoWallScreenOptions
            ? noNanoBuyNanoWallScreenOptions.options
            : {}),
          title: t("transfer.swap2.form.title"),
          headerLeft: (): React.JSX.Element | null => null,
        }
      : {
          ...("options" in noNanoBuyNanoWallScreenOptions
            ? noNanoBuyNanoWallScreenOptions.options
            : {}),
          headerTitle: t("transfer.swap2.form.title"),
          headerLeft: () => <NavigationHeaderBackButton />,

          headerRight: () => (
            <Flex p={6}>
              <Touchable touchableTestID="NavigationHeaderSwapHistory" onPress={goToSwapHistory}>
                <Icons.Clock color={"neutral.c100"} />
              </Touchable>
            </Flex>
          ),
        };
  }, [goToSwapHistory, noNanoBuyNanoWallScreenOptions, ptxSwapLiveAppMobile?.enabled, t]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: true }}>
      <Stack.Screen
        name={ScreenName.SwapTab}
        component={ptxSwapLiveAppMobile?.enabled ? SwapLiveApp : SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={options}
        initialParams={params as Partial<SwapNavigatorParamList[ScreenName.SwapTab]>}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectAccount}
        component={SelectAccount}
        options={({
          route: {
            params: { target },
          },
        }) => ({
          headerTitle: () => <StepHeader title={t(`transfer.swap2.form.select.${target}.title`)} />,
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectCurrency}
        component={SelectCurrency}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.select.to.title")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectProvider}
        component={SelectProvider}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.provider")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectFees}
        component={SelectFees}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.fees")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={OperationDetails}
        options={({ route }) =>
          ptxSwapLiveAppMobile?.enabled
            ? {
                headerTitle: t("transfer.swap2.history.title"),
                headerLeft: () => <NavigationHeaderBackButton />,
                headerRight: () => null,
              }
            : {
                headerTitle: t("transfer.swap.title"),
                headerLeft: route.params?.fromPendingOperation ? () => null : undefined,
              }
        }
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
          headerLeft: () => null, // Prevent going back while loading
        }}
      />

      {ptxSwapLiveAppMobile?.enabled ? (
        <Stack.Screen
          name={ScreenName.SwapHistory}
          component={SwapHistory}
          options={{
            headerTitle: t("transfer.swap2.history.title"),
            headerRight: () => null,
          }}
        />
      ) : null}
    </Stack.Navigator>
  );
}
