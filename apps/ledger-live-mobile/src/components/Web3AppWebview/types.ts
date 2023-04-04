import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

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

export type WebviewAPI = {
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  loadURL: (url: string) => void;
};
