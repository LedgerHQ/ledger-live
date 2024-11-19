import React from "react";

import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { WebView } from "./WebView";
import { useSwapLiveAppManifest } from "./hooks/useSwapLiveAppManifest";

const APP_MANIFEST_NOT_FOUND_ERROR = new Error("Swap Live App not found");

export function SwapLiveApp() {
  const manifest = useSwapLiveAppManifest();
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

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
