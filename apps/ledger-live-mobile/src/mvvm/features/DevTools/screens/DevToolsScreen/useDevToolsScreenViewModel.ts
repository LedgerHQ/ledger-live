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
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { navigateToPayTab } from "LLM/features/PayTab/utils/navigateToPayTab";
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
  const boundPayCard = usePayCardToolProps({ platform: "native" });
  const onNavigateToPortfolio = useCallback(() => {
    tabNavigation.dispatch(
      StackActions.replace(NavigatorName.Main, {
        screen: NavigatorName.Portfolio,
        params: { screen: ScreenName.Portfolio },
      }),
    );
  }, [tabNavigation]);
  const onNavigateToPayTab = useCallback(() => navigateToPayTab(tabNavigation), [tabNavigation]);
  const payCardToolProps = useMemo(
    () => ({ ...boundPayCard, onNavigateToPortfolio, onNavigateToPayTab }),
    [boundPayCard, onNavigateToPortfolio, onNavigateToPayTab],
  );
  const envToolProps = useEnvDevToolProps();
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { wire, wireState } = useDevToolsRelay();

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsProps },
      { id: "env", config: envToolProps },
      { id: "pay-card", config: payCardToolProps },
    ],
    [featureFlagsProps, envToolProps, payCardToolProps],
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
