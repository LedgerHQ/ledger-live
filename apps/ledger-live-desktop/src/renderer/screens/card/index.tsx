import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import {
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import useTheme from "~/renderer/hooks/useTheme";
import WebPTXPlayer from "~/renderer/components/WebPTXPlayer";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import CardPlatformApp from "./CardPlatformApp";

const appId = "card-program";

const LiveAppCard = () => {
  const { state: urlParams, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const locale = useSelector(localeSelector);
  const language = useSelector(languageSelector);
  const devMode = useSelector(developerModeSelector);

  const mockManifest: LiveAppManifest | undefined =
    process.env.MOCK_REMOTE_LIVE_MANIFEST && JSON.parse(process.env.MOCK_REMOTE_LIVE_MANIFEST)[0];

  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || mockManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;

  /**
   * Given the user is on an internal app (webview url is owned by LL) we must reset the session
   * to ensure the context is reset. last-screen is used to give an external app's webview context
   * of the last screen the user was on before navigating to the external app screen.
   */
  if (manifest?.id) {
    const { localStorage } = window;
    localStorage.removeItem("last-screen");
    localStorage.removeItem("manifest-id");
  }

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
        height: "100%",
      }}
    >
      {manifest ? (
        <WebPTXPlayer
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...urlParams,
            lang: language,
            locale: locale,
            devMode,
            ...Object.fromEntries(searchParams.entries()),
          }}
        />
      ) : null}
    </Card>
  );
};

const CardDapp = () => {
  const ptxCardFlag = useFeature("ptxCard");
  if (ptxCardFlag.enabled) {
    return <LiveAppCard />;
  } else {
    return <CardPlatformApp />;
  }
};
export default CardDapp;
