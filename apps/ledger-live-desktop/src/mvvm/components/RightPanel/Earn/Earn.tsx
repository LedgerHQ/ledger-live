import React, { useMemo } from "react";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { stakeProgramsToEarnParam } from "@ledgerhq/live-common/earn/stakePrograms/index";
import { useSelector } from "LLD/hooks/redux";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { SwapLoader } from "~/renderer/screens/exchange/Swap2/Form/SwapLoader";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useEarnDepositManifest } from "./useEarnDepositManifest";

const TOP_BAR_CONFIG = {
  shouldDisplayName: false,
  shouldDisplayInfo: false,
  shouldDisplayClose: false,
  shouldDisplayNavigation: false,
};

/**
 * Earn deposit widget in the right panel. Renders the Earn live app at `/deposit-widget`,
 * with the same init params as the Earn screen so wallet-api and custom.navigate behave identically.
 */
export const Earn = () => {
  const manifest = useEarnDepositManifest();
  const { updateManifests, state } = useRemoteLiveAppContext();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const devMode = useSelector(developerModeSelector);
  const theme = useTheme().theme;
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  const stakePrograms = useVersionedStakePrograms();
  const { stakeProgramsParam, stakeCurrenciesParam } = useMemo(
    () => stakeProgramsToEarnParam(stakePrograms),
    [stakePrograms],
  );

  const inputs = useMemo(
    () => ({
      theme,
      lang: language,
      locale,
      countryLocale,
      currencyTicker: fiatCurrency.ticker,
      discreetMode: discreetMode ? "true" : "false",
      OS: "web",
      lw40enabled: "true",
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
      devMode,
    }),
    [
      theme,
      language,
      locale,
      countryLocale,
      fiatCurrency.ticker,
      discreetMode,
      stakeProgramsParam,
      stakeCurrenciesParam,
      devMode,
    ],
  );

  if (!manifest && state.isLoading) {
    return (
      <div className="flex h-full flex-col pb-32" data-testid="earn-deposit-widget-loader">
        <SwapLoader isLoading />
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex h-full flex-col pb-32" data-testid="earn-deposit-widget-warning">
        <NetworkErrorScreen refresh={updateManifests} type="warning" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pb-32" data-testid="earn-deposit-widget">
      <WebPlatformPlayer config={{ topBarConfig: TOP_BAR_CONFIG }} manifest={manifest} inputs={inputs} />
    </div>
  );
};
