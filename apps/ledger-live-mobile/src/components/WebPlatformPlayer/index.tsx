import { matchVersion } from "@ledgerhq/live-common/platform/filters";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import React from "react";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView } from "./WebView";

type Props = {
  manifest: AppManifest;
  inputs?: Record<string, string>;
};

const WebViewWrapper = ({ manifest, inputs }: Props) => {
  if (matchVersion({ version: "2.0.0" }, manifest)) {
    return <WebViewV2 manifest={manifest} inputs={inputs} />;
  }
  return <WebView manifest={manifest} inputs={inputs} />;
};

export default WebViewWrapper;
