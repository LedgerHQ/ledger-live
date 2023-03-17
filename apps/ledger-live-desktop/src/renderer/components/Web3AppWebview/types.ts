import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { RefObject } from "react";

// Somehow electron types doesn't expose the <WebviewTag> type. Here is a workaround so we can work with types
export type WebviewTag = ReturnType<Document["createElement"]>;
export type TopBarRenderFunc = (
  manifest: LiveAppManifest,
  webviewRef: RefObject<WebviewTag>,
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
