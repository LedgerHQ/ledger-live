import React, { useState } from "react";

import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/defaultFeatures";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GenericErrorView from "~/components/GenericErrorView";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { WebView } from "./WebView";

// set the default manifest ID for the production swap live app
// in case the FF is failing to load the manifest ID
// "swap-live-app-demo-3" points to production vercel URL for the swap live app
const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

export function SwapLiveApp() {
  const { t } = useTranslation();
  const ptxSwapLiveAppMobile = useFeature("ptxSwapLiveAppMobile");

  const APP_MANIFEST_NOT_FOUND_ERROR = new Error(t("errors.AppManifestNotFoundError.title"));
  const APP_MANIFEST_UNKNOWN_ERROR = new Error(t("errors.AppManifestUnknownError.title"));

  const swapLiveAppManifestID =
    (ptxSwapLiveAppMobile?.params?.manifest_id as string) || DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(
    swapLiveAppManifestID || undefined,
  );
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(
    swapLiveAppManifestID || undefined,
  );
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const isWebviewError = webviewState?.url.includes("/unknown-error");

  const manifest: LiveAppManifest | undefined = !localManifest ? remoteManifest : localManifest;

  if (!manifest || isWebviewError) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
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
    <Flex flex={1} testID="swap-form-tab">
      <WebView manifest={manifest} setWebviewState={setWebviewState} />
    </Flex>
  );
}
