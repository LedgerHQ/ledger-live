import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { themeSelector } from "~/renderer/actions/general";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export type LiveAppWebviewInputs = {
  devMode: string;
  theme: string;
  lang: string;
  locale: string;
  countryLocale: string;
  currencyTicker: string;
  OS: string;
  platform: "LLD";
  discreetMode: string;
};

/** The host context a full-page live app gets as URL params. */
export function useLiveAppWebviewInputs(): LiveAppWebviewInputs {
  const theme = useSelector(themeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const lang = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const devMode = useSelector(developerModeSelector);
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;

  return useMemo(
    () => ({
      devMode: devMode.toString(),
      theme,
      lang,
      locale,
      countryLocale,
      currencyTicker: fiatCurrency.ticker,
      OS: "web",
      platform: "LLD",
      discreetMode: discreetMode ? "true" : "false",
    }),
    [countryLocale, devMode, discreetMode, fiatCurrency.ticker, lang, locale, theme],
  );
}
