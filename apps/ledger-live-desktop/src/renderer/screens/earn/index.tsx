import React from "react";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import { languageSelector } from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";

const DEFAULT_EARN_APP_ID = "earn";

const Earn = () => {
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(DEFAULT_EARN_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_EARN_APP_ID);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme("colors.palette.type");

  useDeepLinkListener();

  return (
    // TODO: Remove @ts-ignore after Card component be compatible with TS
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Card grow style={{ overflow: "hidden" }} data-test-id="earn-app-container">
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
            lang: locale,
          }}
        />
      ) : null}
    </Card>
  );
};

export default Earn;
