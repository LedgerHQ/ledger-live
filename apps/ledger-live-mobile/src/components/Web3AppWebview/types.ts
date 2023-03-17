import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { RefObject } from "react";
import { WebView as RNWebView } from "react-native-webview";

export type TopBarRenderFunc = (
  manifest: LiveAppManifest,
  webviewRef: RefObject<RNWebView>,
  webviewState: WebviewState,
) => JSX.Element;

export type WebviewProps = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
  renderTopBar?: TopBarRenderFunc;
};

export type WebviewState = {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
  loading: boolean;
};
