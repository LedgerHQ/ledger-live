import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { WebContents } from "electron";

export interface WebviewTag extends Electron.WebviewTag {
  contentWindow: WebContents;
}

export type WebviewProps = {
  // TODO: technically it's LiveAppManifest | AppManifest depends on `apiVersion`
  manifest: LiveAppManifest;
  inputs?: Record<string, string | boolean | undefined>;
  onStateChange?: (webviewState: WebviewState) => void;
  customHandlers?: WalletAPICustomHandlers;
  currentAccountHistDb?: CurrentAccountHistDB;
  hideLoader?: boolean;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> & { notify: (method: `event.${string}`, params: any) => void };
