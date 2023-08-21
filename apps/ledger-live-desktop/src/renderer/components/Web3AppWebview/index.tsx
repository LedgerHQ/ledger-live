/* eslint-disable react/prop-types */

import semver from "semver";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import TrackPage from "~/renderer/analytics/TrackPage";
import { WebviewAPI, WebviewProps } from "./types";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs, onStateChange }, ref) => {
    <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />;

    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={onStateChange}
          ref={ref}
        />
      );
    }

    return (
      <PlatformAPIWebview
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
        ref={ref}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
