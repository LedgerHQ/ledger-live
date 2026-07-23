import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/earn/stakePrograms/index";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React, { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import { useLocation } from "react-router";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import Box from "~/renderer/components/Box";
import { computeEarnUiVersion } from "@ledgerhq/live-common/domain/computeEarnUiVersion";
import { buildEarnGoToURL } from "./buildEarnGoToURL";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || FEATURE_FLAGS_DEFAULTS.ptxEarnLiveApp.params?.manifest_id;

const Earn = () => {
  const location = useLocation();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const devMode = useSelector(developerModeSelector);
  const earnFlag = useFeature("ptxEarnLiveApp");
  const earnManifestId = earnFlag?.enabled ? earnFlag.params?.manifest_id : DEFAULT_MANIFEST_ID;
  const earnUiVersion = useFeature("ptxEarnUi")?.params?.value ?? "v2";
  const localManifest = useLocalLiveAppManifest(earnManifestId);
  const remoteManifest = useRemoteLiveAppManifest(earnManifestId);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().theme;
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  const { shouldDisplayEarnUpselling, shouldDisplayEarnSimulator } =
    useWalletFeaturesConfig("desktop");

  const computedUiVersion = computeEarnUiVersion({
    baseUiVersion: earnUiVersion,
    shouldDisplayEarnUpselling,
    shouldDisplayEarnSimulator,
  });

  useDeepLinkListener();

  const stakePrograms = useVersionedStakePrograms();
  const { stakeProgramsParam, stakeCurrenciesParam } = useMemo(
    () => stakeProgramsToEarnParam(stakePrograms),
    [stakePrograms],
  );
  const ethDepositCohort = useMemo(
    () => getEthDepositScreenSetting(stakePrograms),
    [stakePrograms],
  );

  const swapToEarnFlag = useFeature("swapToEarn");
  const swapToEarnParam = useMemo(
    () =>
      swapToEarnFlag
        ? JSON.stringify({ enabled: swapToEarnFlag.enabled, params: swapToEarnFlag.params })
        : undefined,
    [swapToEarnFlag],
  );

  const { updateManifests } = useRemoteLiveAppContext();

  const inputs = useMemo(() => {
    const routeState = (location.state as Record<string, string | undefined> | null) ?? {};
    const { customDappUrl, ...earnRouteParams } = routeState;

    const earnInitParams = {
      theme: themeType,
      lang: language,
      locale,
      countryLocale,
      currencyTicker: fiatCurrency.ticker,
      discreetMode: discreetMode ? "true" : "false",
      OS: "web",
      uiVersion: computedUiVersion,
      lw40enabled: "true",
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam ? JSON.stringify(stakeCurrenciesParam) : undefined,
      ethDepositCohort,
      swapToEarn: swapToEarnParam,
    };

    return {
      ...earnInitParams,
      ...earnRouteParams,
      devMode,
      routerState: JSON.stringify(location.state ?? {}),
      goToURL: customDappUrl ? buildEarnGoToURL(customDappUrl, earnInitParams) : undefined,
    };
  }, [
    location.state,
    themeType,
    language,
    locale,
    countryLocale,
    fiatCurrency.ticker,
    discreetMode,
    devMode,
    computedUiVersion,
    stakeProgramsParam,
    stakeCurrenciesParam,
    ethDepositCohort,
    swapToEarnParam,
  ]);

  if (!manifest) {
    return <NetworkErrorScreen refresh={updateManifests} type="warning" />;
  }

  return (
    <Box grow style={{ overflow: "hidden" }} data-testid="earn-app-container">
      <WebPlatformPlayer
        config={{
          topBarConfig: {
            shouldDisplayName: false,
            shouldDisplayInfo: false,
            shouldDisplayClose: false,
            shouldDisplayNavigation: false,
          },
        }}
        manifest={manifest}
        inputs={inputs}
      />
    </Box>
  );
};

export default Earn;
