import semver from "semver";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WebView as WebViewV2, WebPlatformPlayerConfig } from "./WebViewV2";
import { WebView as WebViewV1 } from "./WebView";

interface Props {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
  onClose?: () => void;
  config?: WebPlatformPlayerConfig;
}

export default function WebView({ manifest, inputs, onClose, config }: Props) {
  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} onClose={onClose} config={config} />;
  }

  return <WebViewV1 manifest={manifest} inputs={inputs} onClose={onClose} config={config} />;
}
