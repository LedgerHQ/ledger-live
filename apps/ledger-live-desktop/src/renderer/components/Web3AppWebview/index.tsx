/* eslint-disable react/prop-types */

import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import semver from "semver";
import TrackPage from "~/renderer/analytics/TrackPage";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { WebviewAPI, WebviewProps } from "./types";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      currentAccountHistDb,
      inputs,
      customHandlers,
      webviewStyle,
      onStateChange,
      hideLoader,
    },
    ref,
  ) => {
    <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />;

    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          key={manifest.id}
          manifest={manifest}
          currentAccountHistDb={currentAccountHistDb}
          inputs={inputs}
          customHandlers={customHandlers}
          onStateChange={onStateChange}
          ref={ref}
          hideLoader={hideLoader}
          webviewStyle={webviewStyle}
        />
      );
    }

    return (
      <PlatformAPIWebview
        key={manifest.id}
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        inputs={inputs}
        onStateChange={onStateChange}
        ref={ref}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
