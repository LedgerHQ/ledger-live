import semver from "semver";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView } from "./WebView";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

const WebViewWrapper = ({ manifest, inputs }: Props) => {
  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} />;
  }
  return <WebView manifest={manifest} inputs={inputs} />;
};

export default WebViewWrapper;
