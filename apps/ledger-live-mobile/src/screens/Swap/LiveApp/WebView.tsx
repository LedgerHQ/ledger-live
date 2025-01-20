import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { useSwapLiveAppCustomHandlers } from "./hooks/useSwapLiveAppCustomHandlers";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
};

export function WebView({ manifest, setWebviewState }: Props) {
  const customHandlers = useSwapLiveAppCustomHandlers(manifest);
  return (
    <TabBarSafeAreaView>
      <Web3AppWebview
        manifest={manifest}
        customHandlers={customHandlers}
        onStateChange={setWebviewState}
      />
    </TabBarSafeAreaView>
  );
}
