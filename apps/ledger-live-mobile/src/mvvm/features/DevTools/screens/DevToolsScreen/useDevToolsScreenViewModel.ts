import { useCallback, useMemo } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
  useAppConfigToolProps,
  useCoinConfigToolProps,
  useAccountDetailToolProps,
  useReceiveToolProps,
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
import { useDeviceOnboardingTool } from "../../DeviceOnboarding/useDeviceOnboardingTool";
import { useOfferSync } from "../../../DeviceOnboarding/hooks/useOfferSync";
import { useDevToolsRelay } from "./useDevToolsRelay";

type BaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

const getLiveConfigValue = (key: string): unknown => LiveConfig.getValueByKey(key);
const getLiveConfigDefaultValue = (key: string): unknown => LiveConfig.getDefaultValueByKey(key);

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
  const onNavigateToPaySuccessMe = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugPayContactSuccess,
      params: { recipient: "me" },
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
      onNavigateToPaySuccessMe,
      onNavigateToSendSuccess,
    }),
    [
      boundPayCard,
      onNavigateToPortfolio,
      onNavigateToPayTab,
      onNavigateToPaySuccess,
      onNavigateToPaySuccessMe,
      onNavigateToSendSuccess,
    ],
  );
  const envToolProps = useEnvDevToolProps();
  const appConfigToolProps = useAppConfigToolProps();
  const liveConfigKeys = useMemo(() => Object.keys(LiveConfig.instance.config), []);
  const coinConfigToolProps = useCoinConfigToolProps({
    keys: liveConfigKeys,
    getValueByKey: getLiveConfigValue,
    getDefaultValueByKey: getLiveConfigDefaultValue,
  });
  const accountDetailToolProps = useAccountDetailToolProps();
  const receiveToolProps = useReceiveToolProps();
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  const offerSync = useOfferSync();
  const deviceOnboardingProps = useDeviceOnboardingTool({
    dmk,
    knownDevices,
    offerSync,
    navigateOnExit: false,
  });
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { wire, wireState } = useDevToolsRelay();

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsProps },
      { id: "env", config: envToolProps },
      { id: "app-config", config: appConfigToolProps },
      { id: "coin-config", config: coinConfigToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "device-onboarding", config: deviceOnboardingProps },
      { id: "account-detail", config: accountDetailToolProps },
      { id: "receive", config: receiveToolProps },
    ],
    [
      featureFlagsProps,
      envToolProps,
      appConfigToolProps,
      coinConfigToolProps,
      payCardToolProps,
      deviceOnboardingProps,
      accountDetailToolProps,
      receiveToolProps,
    ],
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
