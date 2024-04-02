import semver from "semver";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WebviewAPI, WebviewProps } from "./types";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      currentAccountHistDb,
      inputs,
      customHandlers,
      onStateChange,
      allowsBackForwardNavigationGestures,
    },
    ref,
  ) => {
    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          ref={ref}
          manifest={manifest}
          currentAccountHistDb={currentAccountHistDb}
          inputs={inputs}
          customHandlers={customHandlers}
          onStateChange={onStateChange}
          allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
        />
      );
    }
    return (
      <PlatformAPIWebview
        ref={ref}
        currentAccountHistDb={currentAccountHistDb}
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
