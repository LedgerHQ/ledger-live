/* eslint-disable react/prop-types */

import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { forwardRef } from "react";
import semver from "semver";
import { serializeAllowedOrigins } from "~/bridge/webviewAllowedOrigins";
import { TrackPage } from "@shared/analytics-react";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { WebviewAPI, WebviewProps } from "./types";

export const Web3AppWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      currentAccountHistDb,
      setCurrentAccountHistDb,
      currentAccountHistDbLoaded,
      inputs,
      customHandlers,
      webviewStyle,
      onStateChange,
      hideLoader,
      Loader,
    },
    ref,
  ) => {
    <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />;

    // The guest's origin allowlist is bound when it is created, so a refreshed manifest
    // with the same id but other domains must get a new guest.
    const webviewKey = `${manifest.id}:${serializeAllowedOrigins(manifest.domains ?? [])}`;

    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          key={webviewKey}
          manifest={manifest}
          currentAccountHistDb={currentAccountHistDb}
          setCurrentAccountHistDb={setCurrentAccountHistDb}
          currentAccountHistDbLoaded={currentAccountHistDbLoaded}
          inputs={inputs}
          customHandlers={customHandlers}
          onStateChange={onStateChange}
          ref={ref}
          hideLoader={hideLoader}
          webviewStyle={webviewStyle}
          Loader={Loader}
        />
      );
    }

    return (
      <PlatformAPIWebview
        key={webviewKey}
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
        currentAccountHistDb={currentAccountHistDb}
        setCurrentAccountHistDb={setCurrentAccountHistDb}
        ref={ref}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
