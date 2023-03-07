import semver from "semver";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView } from "./WebView";
import { WebPlatformPlayerConfig } from "./types";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
  config?: WebPlatformPlayerConfig;
};

const WebViewWrapper = ({ manifest, inputs, config }: Props) => {
  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} />;
  }
  return <WebView manifest={manifest} inputs={inputs} config={config} />;
};

export default WebViewWrapper;
