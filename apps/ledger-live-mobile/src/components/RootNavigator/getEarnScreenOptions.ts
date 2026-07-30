import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { TFunction } from "i18next";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

export type EarnScreenOptions = Partial<NativeStackNavigationOptions> & { closable?: boolean };

const renderNullHeaderRight = () => null;

const liveAppCanvasScreenStyles = (
  canvasColor: string,
): Pick<EarnScreenOptions, "headerStyle" | "headerShadowVisible" | "contentStyle"> => ({
  headerStyle: { backgroundColor: canvasColor },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: canvasColor },
});

/**
 * Resolves the Base-stack screen options for the Earn live-app screen from the deeplink intent:
 * - `deposit`: native header titled with the locale-based stake label; when `swapToEarn` is enabled,
 *   header and content use the live-app canvas (same as the webview shell).
 * - `withdraw`: native header titled with the locale-based stake label (default stack styling).
 * - `simulate`: full-screen Rewards simulator painted on the live-app canvas (no header shadow,
 *   canvas background on both the header and the content so there is no gray flash before the
 *   webview paints).
 * - anything else (dashboard tab): no header.
 */
export const getEarnScreenOptions = (
  intent: string | undefined,
  t: TFunction,
  canvasColor: string,
  isSwapToEarnEnabled = false,
): EarnScreenOptions => {
  if (intent === "deposit") {
    return {
      headerShown: true,
      closable: false,
      headerTitle: t(getStakeLabelLocaleBased()),
      headerRight: renderNullHeaderRight,
      ...(isSwapToEarnEnabled ? liveAppCanvasScreenStyles(canvasColor) : {}),
    };
  }

  if (intent === "withdraw") {
    return {
      headerShown: true,
      closable: false,
      headerTitle: t(getStakeLabelLocaleBased()),
      headerRight: renderNullHeaderRight,
    };
  }

  if (intent === "simulate") {
    return {
      headerShown: true,
      closable: false,
      headerTitle: t("earn.simulator.title"),
      headerRight: renderNullHeaderRight,
      ...liveAppCanvasScreenStyles(canvasColor),
    };
  }

  return { headerShown: false };
};

/** Whether the Earn V2 webview shell should use the live-app canvas background. */
export const shouldDisplayEarnBackgroundCanvas = (
  intent: string | undefined,
  isSwapToEarnEnabled: boolean,
): boolean => (isSwapToEarnEnabled && intent === "deposit") || intent === "simulate";

type EarnScreenRouteParams = { intent?: string } | undefined;

/** Resolves Base-stack options from nested Earn navigator route params. */
export const getEarnScreenOptionsFromRouteParams = (
  routeParams: EarnScreenRouteParams,
  t: TFunction,
  canvasColor: string,
  isSwapToEarnEnabled: boolean,
): EarnScreenOptions =>
  getEarnScreenOptions(routeParams?.intent, t, canvasColor, isSwapToEarnEnabled);
