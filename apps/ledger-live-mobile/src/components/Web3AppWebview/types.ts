import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import WebView from "react-native-webview";

export type WebviewProps = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
  onStateChange?: (webviewState: WebviewState) => void;
  allowsBackForwardNavigationGestures?: boolean;
};

export type WebviewState = {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
  loading: boolean;
};

export type WebviewAPI = Pick<WebView, "reload" | "goBack" | "goForward"> & {
  loadURL: (url: string) => void;
};
