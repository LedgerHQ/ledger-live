import semver from "semver";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WebviewAPI, WebviewProps } from "./types";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    { manifest, inputs, onStateChange, allowsBackForwardNavigationGestures },
    ref,
  ) => {
    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          ref={ref}
          manifest={manifest}
          inputs={inputs}
          onStateChange={onStateChange}
          allowsBackForwardNavigationGestures={
            allowsBackForwardNavigationGestures
          }
        />
      );
    }
    return (
      <PlatformAPIWebview
        ref={ref}
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
