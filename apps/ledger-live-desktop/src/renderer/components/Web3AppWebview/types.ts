import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WebContents } from "electron";

export interface WebviewTag extends Electron.WebviewTag {
  contentWindow: WebContents;
}

export type WebviewProps = {
  // TODO: technically it's LiveAppManifest | AppManifest depends on `apiVersion`
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  onStateChange?: (webviewState: WebviewState) => void;
};

export type WebviewState = {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
  loading: boolean;
  isAppUnavailable: boolean;
};

export type WebviewAPI = Pick<
  Electron.WebviewTag,
  "reload" | "goBack" | "goForward" | "openDevTools" | "loadURL" | "clearHistory"
>;
