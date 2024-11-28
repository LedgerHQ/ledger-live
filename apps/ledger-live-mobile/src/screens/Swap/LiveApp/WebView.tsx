import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React from "react";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { useSwapLiveAppCustomHandlers } from "./hooks/useSwapLiveAppCustomHandlers";

type Props = {
  manifest: LiveAppManifest;
};

export function WebView({ manifest }: Props) {
  const customHandlers = useSwapLiveAppCustomHandlers(manifest);

  return (
    <>
      <TabBarSafeAreaView>
        <Web3AppWebview manifest={manifest} customHandlers={customHandlers} />
      </TabBarSafeAreaView>
    </>
  );
}
