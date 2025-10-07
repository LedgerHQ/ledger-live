import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProviderInterstitalEnabled } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { useManifestWithSessionId } from "@ledgerhq/live-common/hooks/useManifestWithSessionId";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import Card from "~/renderer/components/Box/Card";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { WebviewLoader } from "~/renderer/components/Web3AppWebview/types";
import { ProviderInterstitial } from "LLD/components/ProviderInterstitial";
import useTheme from "~/renderer/hooks/useTheme";
import { languageSelector, shareAnalyticsSelector } from "~/renderer/reducers/settings";

const PROVIDER_MANIFEST_ID = "noah";

const Receive = () => {
  const location = useLocation();
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(PROVIDER_MANIFEST_ID);
  const remoteManifest = useRemoteLiveAppManifest(PROVIDER_MANIFEST_ID);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const manifest = localManifest || remoteManifest;
  const { manifest: manifestWithSessionId } = useManifestWithSessionId({
    manifest,
    shareAnalytics,
  });
  const themeType = useTheme().colors.palette.type;
  const params = location.state || {};
  const providerInterstitialEnabled = useProviderInterstitalEnabled({
    manifest,
  });

  return (
    <Card grow style={{ overflow: "hidden" }} data-testid="reveive-app-container">
      {manifestWithSessionId ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation: false,
            },
          }}
          manifest={manifestWithSessionId}
          inputs={{
            theme: themeType,
            lang: locale,
            ...params,
          }}
          Loader={providerInterstitialEnabled ? CustomProviderInterstitial : undefined}
        />
      ) : null}
    </Card>
  );
};

const CustomProviderInterstitial: WebviewLoader = props => {
  const { t } = useTranslation();
  return <ProviderInterstitial {...props} description={t("receive.connectToNoah")} />;
};

export default Receive;
