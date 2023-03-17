import semver from "semver";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WebviewProps } from "./types";

function Web3AppWebview({ manifest, inputs, renderTopBar }: WebviewProps) {
  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return (
      <WalletAPIWebview
        manifest={manifest}
        inputs={inputs}
        renderTopBar={renderTopBar}
      />
    );
  }
  return (
    <PlatformAPIWebview
      manifest={manifest}
      inputs={inputs}
      renderTopBar={renderTopBar}
    />
  );
}

export default Web3AppWebview;
