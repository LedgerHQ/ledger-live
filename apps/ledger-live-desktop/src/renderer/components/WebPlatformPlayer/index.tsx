import { matchVersion } from "@ledgerhq/live-common/platform/filters";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import React from "react";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView as WebViewV1 } from "./WebView";

interface Props {
  manifest: AppManifest;
  inputs?: Record<string, any>;
}

export default function WebView({ manifest, inputs }: Props) {
  if (matchVersion({ version: "2.0.0" }, manifest)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} />;
  }

  return <WebViewV1 manifest={manifest} inputs={inputs} />;
}
