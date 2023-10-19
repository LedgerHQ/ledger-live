import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import WebView from "react-native-webview";

export type WebviewProps = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  onStateChange?: (webviewState: WebviewState) => void;
  allowsBackForwardNavigationGestures?: boolean;
  customHandlers?: WalletAPICustomHandlers;
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
