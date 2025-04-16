import { stakeProgramsToEarnParam } from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
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

const DEFAULT_EARN_APP_ID = "earn";

const Earn = () => {
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const localManifest = useLocalLiveAppManifest(DEFAULT_EARN_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_EARN_APP_ID);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  useDeepLinkListener();

  const stakePrograms = useFeature("stakePrograms");
  const stakeProgramsParam = useMemo(
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
            stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
          }}
        />
      ) : null}
    </Card>
  );
};

export default Earn;
