import semver from "semver";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React from "react";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView as WebViewV1 } from "./WebView";

interface Props {
  manifest: AppManifest;
  inputs?: Record<string, any>;
}

export default function WebView({ manifest, inputs }: Props) {
  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} />;
  }

  return <WebViewV1 manifest={manifest} inputs={inputs} />;
}
