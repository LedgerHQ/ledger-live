import { useCallback, useMemo } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
} from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import { openHostedUrlInSecureBrowser } from "@features/flow-pay-card-auth";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import { navigateToPayTab } from "LLM/features/PayTab/utils/navigateToPayTab";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import { useDeviceOnboarding } from "../../../DeviceOnboarding/hooks/useDeviceOnboarding";
import { useOfferSync } from "../../../DeviceOnboarding/hooks/useOfferSync";
import { useDevToolsRelay } from "./useDevToolsRelay";

type BaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

export function useDevToolsScreenViewModel() {
  const navigation = useNavigation<BaseNavigation>();
  const tabNavigation = navigation.getParent(BASE_NAVIGATOR_ID) ?? navigation;
  const featureFlagsProps = useFeatureFlagsToolProps();

  const onNavigateToPortfolio = useCallback(() => {
    tabNavigation.dispatch(
      StackActions.replace(NavigatorName.Main, {
        screen: NavigatorName.Portfolio,
        params: { screen: ScreenName.Portfolio },
      }),
    );
  }, [tabNavigation]);

  const onNavigateToPayTab = useCallback(() => navigateToPayTab(tabNavigation), [tabNavigation]);
  const onNavigateToPaySuccess = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugPayContactSuccess,
    });
  }, [navigation]);
  const onNavigateToSendSuccess = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugSendSuccess,
    });
  }, [navigation]);

  const openSecureBrowser = useCallback(async (url: string) => {
    const result = await openHostedUrlInSecureBrowser(url, PAY_TAB_DEEP_LINK);
    return result.type === "success" ? `redirected to ${result.url}` : "dismissed";
  }, []);

  const currencies = useCurrenciesByIds(BAANX_LEDGER_CURRENCY_IDS);

  const boundPayCard = usePayCardToolProps({
    platform: "native",
    openPayTab: onNavigateToPayTab,
    openSecureBrowser,
    currencies,
  });

  const payCardToolProps = useMemo(
    () => ({
      ...boundPayCard,
      onNavigateToPortfolio,
      onNavigateToPayTab,
      onNavigateToPaySuccess,
      onNavigateToSendSuccess,
    }),
    [
      boundPayCard,
      onNavigateToPortfolio,
      onNavigateToPayTab,
      onNavigateToPaySuccess,
      onNavigateToSendSuccess,
    ],
  );
  const envToolProps = useEnvDevToolProps();
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  const offerSync = useOfferSync();
  const deviceOnboardingProps = useDeviceOnboarding({
    dmk,
    knownDevices,
    offerSync,
  });
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { wire, wireState } = useDevToolsRelay();

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsProps },
      { id: "env", config: envToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "device-onboarding", config: deviceOnboardingProps },
    ],
    [featureFlagsProps, envToolProps, payCardToolProps, deviceOnboardingProps],
  );

  const screenOptions: NativeStackNavigationOptions = useMemo(() => {
    const navConfig = getStackNavigationConfigV4(theme);
    return {
      ...navConfig,
      contentStyle: [navConfig.contentStyle, { paddingBottom: bottom }],
    };
  }, [theme, bottom]);

  return {
    config,
    screenOptions,
    transport: wire.transport,
    hubUrl: wireState.hubUrl,
    setHubUrl: wire.setHubUrl,
    role: wireState.role,
  };
}
