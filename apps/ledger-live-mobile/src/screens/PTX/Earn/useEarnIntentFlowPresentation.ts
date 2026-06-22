import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { BASE_NAVIGATOR_ID, NavigatorName } from "~/const";
import { getEarnScreenOptions } from "~/components/RootNavigator/getEarnScreenOptions";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getIntentFlowState, getWebviewIntent } from "./getWebviewIntent";

/** Debounce before leaving the Base-stack intent presentation — avoids bouncing to the Earn tab
 * when the webview briefly reports a dashboard URL while transitioning (e.g. simulate → deposit). */
const EXIT_INTENT_FLOW_DEBOUNCE_MS = 500;

/** Navigation typed with {@link BASE_NAVIGATOR_ID} so `getParent(BASE_NAVIGATOR_ID)` is type-safe. */
type EarnBaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

type Params = {
  hideMainNavigator?: boolean;
  webviewUrl?: string;
  webviewUrlRef: React.MutableRefObject<string | undefined>;
  canvasColor: string;
};

/**
 * Drives the Base-stack presentation for an earn intent flow from the live webview's own route.
 *
 * The native header lives on the Base navigator (the earn live-app stack is `headerShown: false`),
 * so we update it imperatively on the parent. We deliberately do not mutate route params via a
 * cross-navigator `navigate({ merge })` — that wipes the Earn route params (see LIVE-32789).
 */
export function useEarnIntentFlowPresentation({
  hideMainNavigator,
  webviewUrl,
  webviewUrlRef,
  canvasColor,
}: Params) {
  const navigation = useNavigation<EarnBaseNavigation>();
  const { t } = useTranslation();

  const intentFlowState = getIntentFlowState(webviewUrl);
  const webviewIntent = getWebviewIntent(webviewUrl);

  useEffect(() => {
    if (!hideMainNavigator) return;

    // Webview is back on a dashboard route → return to the Earn tab (debounced to ignore the
    // transient dashboard URL seen while transitioning, e.g. simulate → deposit).
    if (intentFlowState === false) {
      const timeout = setTimeout(() => {
        if (getIntentFlowState(webviewUrlRef.current) !== false) return;
        navigation.navigate(NavigatorName.Main, { screen: NavigatorName.Earn });
      }, EXIT_INTENT_FLOW_DEBOUNCE_MS);

      return () => clearTimeout(timeout);
    }

    // Still in an intent flow → keep the Base native header in sync with the webview intent.
    if (webviewIntent) {
      navigation
        .getParent(BASE_NAVIGATOR_ID)
        ?.setOptions(getEarnScreenOptions(webviewIntent, t, canvasColor));
    }
  }, [
    hideMainNavigator,
    intentFlowState,
    webviewIntent,
    navigation,
    t,
    canvasColor,
    webviewUrlRef,
  ]);

  return { intentFlowState, webviewIntent };
}
