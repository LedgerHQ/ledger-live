import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import useTheme from "~/renderer/hooks/useTheme";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { WebviewProps } from "~/renderer/components/Web3AppWebview/types";

export const useLiveAppParameters = (): WebviewProps["inputs"] => {
  const themeType = useTheme().colors.palette.type;
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const discreetMode = useDiscreetMode();
  return {
    theme: themeType,
    lang: language,
    locale: locale,
    currencyTicker: fiatCurrency.ticker,
    discreetMode: discreetMode ? "true" : "false",
  };
};
