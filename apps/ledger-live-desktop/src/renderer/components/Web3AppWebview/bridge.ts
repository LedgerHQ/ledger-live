import { type RefObject, useEffect } from "react";
import type { WebviewBridgeMessage } from "~/bridge/contract";
import { webview } from "~/renderer/bridge";
import { getAttachedWebview } from "./helpers";
import type { WebviewTag } from "./types";

/**
 * Live App bridge messages of this <webview>. Main only forwards those sent by the guest
 * main frame on an allowed origin, tagged with that origin.
 */
export function useWebviewBridgeMessages(
  webviewRef: RefObject<WebviewTag | null>,
  onBridgeMessage: (message: WebviewBridgeMessage) => void,
): void {
  useEffect(
    () =>
      webview.onMessage(message => {
        if (getAttachedWebview(webviewRef)?.getWebContentsId() !== message.guestId) return;
        onBridgeMessage(message);
      }),
    [webviewRef, onBridgeMessage],
  );
}
