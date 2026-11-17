import { useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "~/context/hooks";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  exportSettingsSelector,
  resolvedThemeSelector,
} from "~/reducers/settings";

export type LiveAppWebviewInputs = {
  devMode: string;
  theme: string;
  lang: string;
  locale: string;
  countryLocale: string;
  currencyTicker: string;
  OS: string;
  platform: "LLM";
  discreetMode: string;
  // Safe-area insets (RN layout units) forwarded to the web app; stringified for query params.
  safeAreaTop: string;
  safeAreaBottom: string;
  safeAreaLeft: string;
  safeAreaRight: string;
};

/** The host context a full-screen live app gets as URL params. */
export function useLiveAppWebviewInputs(): LiveAppWebviewInputs {
  const theme = useSelector(resolvedThemeSelector);
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const exportSettings = useSelector(exportSettingsSelector);
  const discreetMode = useSelector(discreetModeSelector);
  const insets = useSafeAreaInsets();
  const countryLocale = getCountryLocale();

  return useMemo(
    () => ({
      devMode: exportSettings.developerModeEnabled.toString(),
      theme,
      lang: language,
      locale: language,
      countryLocale,
      currencyTicker,
      OS: Platform.OS,
      platform: "LLM",
      discreetMode: discreetMode ? "true" : "false",
      safeAreaTop: insets.top.toString(),
      safeAreaBottom: insets.bottom.toString(),
      safeAreaLeft: insets.left.toString(),
      safeAreaRight: insets.right.toString(),
    }),
    [
      currencyTicker,
      countryLocale,
      discreetMode,
      exportSettings.developerModeEnabled,
      language,
      theme,
      insets.top,
      insets.bottom,
      insets.left,
      insets.right,
    ],
  );
}
