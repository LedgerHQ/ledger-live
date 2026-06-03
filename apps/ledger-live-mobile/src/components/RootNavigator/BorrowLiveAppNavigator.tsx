import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { BorrowLiveAppNavigatorParamList } from "./types/BorrowLiveAppNavigator";
import { BorrowLiveAppWrapper } from "LLM/features/Borrow";
import type { BorrowSwapNavigationParams } from "@ledgerhq/live-common/wallet-api/Borrow/types";
import type { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import type { BaseComposite, BaseNavigation, StackNavigatorProps } from "./types/helpers";

const Stack = createNativeStackNavigator<BorrowLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<BorrowLiveAppNavigatorParamList, ScreenName.Borrow>
>;

type BorrowNavigation = NavigationProp<ParamListBase>;

const Borrow = (props: NavigationProps) => {
  const paramAction = props.route.params?.action;
  const navigation: BorrowNavigation = props.navigation as unknown as BorrowNavigation;
  const baseNavigation = useNavigation<BaseNavigation>();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  const triggerGoBackAction = useCallback(() => {
    navigation.navigate(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {
        ...props.route.params,
        action: "go-back",
      },
    });
  }, [navigation, props.route.params]);

  const clearDeepLink = useCallback(() => {
    navigation.setParams({ action: undefined });
  }, [navigation]);

  const goBackNative = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // If there is no previous native screen, stay in Borrow and let the app reload its root step.
    navigation.navigate(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {
        ...props.route.params,
        action: undefined,
      },
    });
  }, [navigation, props.route.params]);

  const goToSwap = useCallback(
    (swapParams: BorrowSwapNavigationParams) => {
      const params: DefaultAccountSwapParamList = {
        ...swapParams,
        fromPath: ScreenName.Borrow,
      };

      navigateToSwapTab({ navigation: baseNavigation, shouldDisplayWallet40MainNav, params });
    },
    [baseNavigation, shouldDisplayWallet40MainNav],
  );

  useEffect(() => {
    if (!paramAction || paramAction === "go-back") {
      return;
    }

    console.warn(`BorrowLiveAppNavigator: No route for action "${paramAction}"`);
    clearDeepLink();
  }, [clearDeepLink, paramAction]);

  return (
    <BorrowLiveAppWrapper
      action={paramAction}
      onNativeGoBack={goBackNative}
      onActionHandled={clearDeepLink}
      onWalletApiGoBack={triggerGoBackAction}
      onWalletApiGoToSwap={goToSwap}
    />
  );
};

export default function BorrowLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig }}>
      <Stack.Screen name={ScreenName.Borrow} component={Borrow} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
