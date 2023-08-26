import React from "react";
import { RouteComponentProps, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import Card from "~/renderer/components/Box/Card";
import { languageSelector } from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import WebPTXPlayer from "~/renderer/components/WebPTXPlayer";
import { LiveAppManifest, Loadable } from "@ledgerhq/live-common/platform/types";
import {
  DEFAULT_MULTIBUY_APP_ID,
  INTERNAL_APP_IDS,
} from "@ledgerhq/live-common/wallet-api/constants";

export type DProps = {
  defaultCurrencyId?: string | null;
  defaultAccountId?: string | null;
  defaultTicker?: string | null;
  rampCatalog: Loadable<RampCatalog>;
};
const LiveAppExchange = ({ appId }: { appId: string }) => {
  const { state: urlParams, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const locale = useSelector(languageSelector);

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
  if (manifest?.id && INTERNAL_APP_IDS.includes(manifest.id)) {
    const { localStorage } = window;
    localStorage.removeItem("last-screen");
    localStorage.removeItem("manifest-id");
    localStorage.removeItem("flow-name");
  }

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
      }}
    >
      {manifest ? (
        <WebPTXPlayer
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...(urlParams as object),
            lang: locale,
            ...Object.fromEntries(searchParams.entries()),
          }}
        />
      ) : null}
    </Card>
  );
};

export type ExchangeComponentParams = {
  appId?: string;
};

const Exchange = ({ match }: RouteComponentProps<ExchangeComponentParams>) => {
  const { params } = match;

  return <LiveAppExchange appId={params.appId || DEFAULT_MULTIBUY_APP_ID} />;
};
export default Exchange;
