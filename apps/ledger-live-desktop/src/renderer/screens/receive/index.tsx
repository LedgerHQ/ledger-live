import { useTranslation } from "react-i18next";
import { useProviderInterstitalEnabled } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Card from "~/renderer/components/Box/Card";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { languageSelector } from "~/renderer/reducers/settings";
import { WebviewLoader } from "~/renderer/components/Web3AppWebview/types";
import { ProviderInterstitial } from "LLD/components/ProviderInterstitial";

const PROVIDER_MANIFEST_ID = "noah";

const Receive = () => {
  const location = useLocation();
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(PROVIDER_MANIFEST_ID);
  const remoteManifest = useRemoteLiveAppManifest(PROVIDER_MANIFEST_ID);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;
  const params = location.state || {};
  const providerInterstitialEnabled = useProviderInterstitalEnabled({
    manifest,
  });

  return (
    <Card grow style={{ overflow: "hidden" }} data-testid="reveive-app-container">
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
