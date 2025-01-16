import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React from "react";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewState } from "~/components/Web3AppWebview/types";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
};

export function WebView({ manifest, setWebviewState }: Props) {
  return (
    <TabBarSafeAreaView>
      <Web3AppWebview manifest={manifest} customHandlers={{}} onStateChange={setWebviewState} />
    </TabBarSafeAreaView>
  );
}
