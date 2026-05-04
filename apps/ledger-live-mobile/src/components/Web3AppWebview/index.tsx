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
      setCurrentAccountHistDb,
      currentAccountHistDbLoaded,
      inputs,
      customHandlers,
      onWalletApiTransactionBroadcast,
      onStateChange,
      allowsBackForwardNavigationGestures,
      onScroll,
      Loader,
    },
    ref,
  ) => {
    if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
      return (
        <WalletAPIWebview
          ref={ref}
          onScroll={onScroll}
          manifest={manifest}
          currentAccountHistDb={currentAccountHistDb}
          setCurrentAccountHistDb={setCurrentAccountHistDb}
          currentAccountHistDbLoaded={currentAccountHistDbLoaded}
          inputs={inputs}
          customHandlers={customHandlers}
          onWalletApiTransactionBroadcast={onWalletApiTransactionBroadcast}
          onStateChange={onStateChange}
          allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
          Loader={Loader}
        />
      );
    }
    return (
      <PlatformAPIWebview
        ref={ref}
        onScroll={onScroll}
        currentAccountHistDb={currentAccountHistDb}
        setCurrentAccountHistDb={setCurrentAccountHistDb}
        currentAccountHistDbLoaded={currentAccountHistDbLoaded}
        manifest={manifest}
        inputs={inputs}
        onStateChange={onStateChange}
      />
    );
  },
);

Web3AppWebview.displayName = "Web3AppWebview";
