import React, { useState } from "react";

import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GenericErrorView from "~/components/GenericErrorView";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { WebView } from "./WebView";

const DEFAULT_SWAP_APP_ID = "swap-live-app-demo-3";

export function SwapLiveApp() {
  const { t } = useTranslation();

  const APP_MANIFEST_NOT_FOUND_ERROR = new Error(t("errors.AppManifestUnknown.title"));
  const APP_MANIFEST_UNKNOWN_ERROR = new Error(t("errors.AppManifestNotFoundError.title"));

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const isWebviewError = webviewState?.url.includes("/unknown-error");

  const manifest: LiveAppManifest | undefined = !localManifest ? remoteManifest : localManifest;

  if (!manifest || isWebviewError) {
    return (
      <Flex flex={1} p={10} justifyContent="center" alignItems="center">
        {remoteLiveAppState.isLoading ? (
          <InfiniteLoader />
        ) : (
          <GenericErrorView
            error={isWebviewError ? APP_MANIFEST_UNKNOWN_ERROR : APP_MANIFEST_NOT_FOUND_ERROR}
          />
        )}
      </Flex>
    );
  }

  return (
    <>
      <TabBarSafeAreaView>
        <WebView manifest={manifest} setWebviewState={setWebviewState} />
      </TabBarSafeAreaView>
    </>
  );
}
