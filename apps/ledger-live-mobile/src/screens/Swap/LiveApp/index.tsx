import React, { useState } from "react";

import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GenericErrorView from "~/components/GenericErrorView";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { WebView } from "./WebView";
import { useSwapLiveAppManifest } from "./hooks/useSwapLiveAppManifest";

export function SwapLiveApp() {
  const { t } = useTranslation();
  const ptxSwapLiveAppMobile = useFeature("ptxSwapLiveAppMobile");

  const APP_MANIFEST_NOT_FOUND_ERROR = new Error(t("errors.AppManifestUnknown.title"));
  const APP_MANIFEST_UNKNOWN_ERROR = new Error(t("errors.AppManifestNotFoundError.title"));

  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const isWebviewError = webviewState?.url.includes("/unknown-error");

  const manifest = useSwapLiveAppManifest();

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
    <Flex flex={1} mb={10}>
      <WebView manifest={manifest} setWebviewState={setWebviewState} />
    </Flex>
  );
}
