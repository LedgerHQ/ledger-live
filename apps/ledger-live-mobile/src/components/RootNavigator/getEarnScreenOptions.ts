import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { TFunction } from "i18next";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

export type EarnScreenOptions = Partial<NativeStackNavigationOptions> & { closable?: boolean };

const renderNullHeaderRight = () => null;

/**
 * Resolves the Base-stack screen options for the Earn live-app screen from the deeplink intent:
 * - `deposit` / `withdraw`: native header titled with the locale-based stake label.
 * - `simulate`: full-screen Rewards simulator painted on the live-app canvas (no header shadow,
 *   canvas background on both the header and the content so there is no gray flash before the
 *   webview paints).
 * - anything else (dashboard tab): no header.
 */
export const getEarnScreenOptions = (
  intent: string | undefined,
  t: TFunction,
  canvasColor: string,
): EarnScreenOptions => {
  if (intent === "deposit" || intent === "withdraw") {
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
      headerStyle: { backgroundColor: canvasColor },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: canvasColor },
    };
  }

  return { headerShown: false };
};
