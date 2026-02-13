import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { DEFAULT_FEATURES, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React, { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import Card from "~/renderer/components/Box/Card";
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

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || DEFAULT_FEATURES.ptxEarnLiveApp.params?.manifest_id;

const Earn = () => {
  const location = useLocation();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const devMode = useSelector(developerModeSelector);
  const earnFlag = useFeature("ptxEarnLiveApp");
  const earnManifestId = earnFlag?.enabled ? earnFlag.params?.manifest_id : DEFAULT_MANIFEST_ID;
  const earnUiFlag = useFeature("ptxEarnUi");
  const earnUiVersion = earnUiFlag?.params?.value ?? "v1";
  const localManifest = useLocalLiveAppManifest(earnManifestId);
  const remoteManifest = useRemoteLiveAppManifest(earnManifestId);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().theme;
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  const { isEnabled: isLwd40Enabled } = useWalletFeaturesConfig("desktop");
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

  const { updateManifests } = useRemoteLiveAppContext();

  if (!manifest) {
    return <NetworkErrorScreen refresh={updateManifests} type="warning" />;
  }

  // if LWM40 is enabled, use Box for transparency, otherwise use Card
  const Container = isLwd40Enabled ? Box : Card;

  return (
    <Container grow style={{ overflow: "hidden" }} data-testid="earn-app-container">
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
        inputs={{
          theme: themeType,
          lang: language,
          locale: locale,
          countryLocale,
          currencyTicker: fiatCurrency.ticker,
          devMode,
          discreetMode: discreetMode ? "true" : "false",
          OS: "web",
          routerState: JSON.stringify(location.state ?? {}),
          stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
          stakeCurrenciesParam: stakeCurrenciesParam
            ? JSON.stringify(stakeCurrenciesParam)
            : undefined,
          ethDepositCohort,
          uiVersion: earnUiVersion,
          lw40enabled: isLwd40Enabled ? "true" : "false",
        }}
      />
    </Container>
  );
};

export default Earn;
