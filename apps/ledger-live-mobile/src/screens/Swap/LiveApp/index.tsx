import React from "react";

import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { WebView } from "./WebView";

const DEFAULT_SWAP_APP_ID = "swap-live-app-demo-3";
const APP_MANIFEST_NOT_FOUND_ERROR = new Error("Swap Live App not found");

export function SwapLiveApp() {
  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest: LiveAppManifest | undefined = !localManifest ? remoteManifest : localManifest;

  if (!manifest) {
    return (
      <Flex flex={1} p={10} justifyContent="center" alignItems="center">
        {remoteLiveAppState.isLoading ? (
          <InfiniteLoader />
        ) : (
          <GenericErrorView error={APP_MANIFEST_NOT_FOUND_ERROR} />
        )}
      </Flex>
    );
  }

  return (
    <>
      <TabBarSafeAreaView>
        <WebView manifest={manifest} />
      </TabBarSafeAreaView>
    </>
  );
}
