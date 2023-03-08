import { WebviewTag } from "electron";
import semver from "semver";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import TrackPage from "~/renderer/analytics/TrackPage";

interface Props {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
}

const Web3AppWebview = React.forwardRef(({ manifest, inputs }: Props, ref: WebviewTag) => {
  <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />;

  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return <WalletAPIWebview manifest={manifest} inputs={inputs} ref={ref} />;
  }

  return <PlatformAPIWebview manifest={manifest} inputs={inputs} ref={ref} />;
});

Web3AppWebview.displayName = "Web3AppWebview";

export default Web3AppWebview;
