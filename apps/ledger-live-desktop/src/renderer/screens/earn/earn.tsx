// @flow

import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import { languageSelector } from "~/renderer/reducers/settings";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import useStakeFlow from "~/renderer/screens/stake";

const LiveAppEarn = ({ appId }: { appId: string }) => {
  const { state: urlParams } = useLocation();
  const locale = useSelector(languageSelector);
  const multibuyNavigation = useFeature("multibuyNavigation");
  const shouldDisplayNavigation = multibuyNavigation?.enabled || false;
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme("colors.palette.type");
  const startStakeFlow = useStakeFlow({ shouldRedirect: false });

  return (
    <Card grow style={{ overflow: "hidden" }}>
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation,
            },
            onMessage: rawMessage => {
              console.log("ON MESSAGE");
              console.log(rawMessage);
              const { type } = JSON.parse(rawMessage);
              if (type === "startStake") {
                startStakeFlow();
              }
            },
          }}
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...urlParams,
            lang: locale,
          }}
        />
      ) : null}
    </Card>
  );
};

const Earn = () => {
  return <LiveAppEarn appId={"earn-dashboard"} />;
};

export default Earn;
