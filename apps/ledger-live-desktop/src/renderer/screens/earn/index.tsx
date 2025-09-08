import { stakeProgramsToEarnParam } from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import Card from "~/renderer/components/Box/Card";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import { useHistory } from "react-router";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || DEFAULT_FEATURES.ptxEarnLiveApp.params?.manifest_id;

const Earn = () => {
  const router = useHistory();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const earnFlag = useFeature("ptxEarnLiveApp");
  const earnManifestId = earnFlag?.enabled ? earnFlag.params?.manifest_id : DEFAULT_MANIFEST_ID;
  
  const mockManifest: any =
    process.env.MOCK_REMOTE_LIVE_MANIFEST && JSON.parse(process.env.MOCK_REMOTE_LIVE_MANIFEST)[0];
  
  const localManifest = useLocalLiveAppManifest(earnManifestId);
  const remoteManifest = useRemoteLiveAppManifest(earnManifestId);
  const manifest = localManifest || mockManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  useDeepLinkListener();

  const stakePrograms = useVersionedStakePrograms();
  const { stakeProgramsParam, stakeCurrenciesParam } = useMemo(
    () => stakeProgramsToEarnParam(stakePrograms),
    [stakePrograms],
  );

  return (
    <Card grow style={{ overflow: "hidden" }} data-testid="earn-app-container">
      {manifest ? (
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
            discreetMode: discreetMode ? "true" : "false",
            OS: "web",
            routerState: JSON.stringify(router.location.state ?? {}),
            stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
            stakeCurrenciesParam: stakeCurrenciesParam
              ? JSON.stringify(stakeCurrenciesParam)
              : undefined,
          }}
        />
      ) : null}
    </Card>
  );
};

export default Earn;
