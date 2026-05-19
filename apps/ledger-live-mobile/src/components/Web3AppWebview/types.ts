import type { ComponentProps } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { DiscoverDB, WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import WebView from "react-native-webview";

export type WebviewProps = {
  manifest: LiveAppManifest;
  currentAccountHistDb?: DiscoverDB["currentAccountHist"];
  setCurrentAccountHistDb?: SetCurrentAccountHistDb;
  currentAccountHistDbLoaded?: boolean;
  inputs?: Record<string, string | undefined>;
  onStateChange?: (webviewState: WebviewState) => void;
  allowsBackForwardNavigationGestures?: boolean;
  customHandlers?: WalletAPICustomHandlers;
  onWalletApiTransactionBroadcast?: () => void;
  onScroll?: ComponentProps<typeof WebView>["onScroll"];
  Loader?: () => React.JSX.Element;
};

export type WebviewState = {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
  loading: boolean;
  isAppUnavailable: boolean;
};

export type WebviewAPI = Pick<WebView, "reload" | "goBack" | "goForward"> & {
  loadURL: (url: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notify: (method: `event.${string}`, params: any) => void;
};

export enum SwapWebviewAllowedPageNames {
  AccountSelection = "account-selection",
  QuotesList = "quotes-list",
  TwoStepApproval = "two-step-approval",
  UnknownError = "unknown-error",
}
