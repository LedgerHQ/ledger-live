import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

// Somehow electron types doesn't expose the <WebviewTag> type. Here is a workaround so we can work with types
export type WebviewTag = ReturnType<Document["createElement"]>;

export type WebviewProps = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
  onStateChange?: (webviewState: WebviewState) => void;
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
  openDevTools: () => void;
  loadURL: (url: string) => Promise<void>;
  clearHistory: () => void;
};
