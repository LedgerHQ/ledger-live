import React from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { Web3AppWebview } from "~/components/Web3AppWebview";

type Props = {
  manifest: LiveAppManifest;
};

export function WebView({ manifest }: Props) {
  return (
    <TabBarSafeAreaView>
      <Web3AppWebview manifest={manifest} customHandlers={{}} />
    </TabBarSafeAreaView>
  );
}
