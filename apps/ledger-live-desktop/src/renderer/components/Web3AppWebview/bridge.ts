import { type RefObject, useCallback, useEffect } from "react";
import {
  type BridgeSessionController,
  useBridgeSession,
} from "@ledgerhq/live-common/wallet-api/bridgeSession";
import type { WebviewBridgeMessage } from "~/bridge/contract";
import { webview } from "~/renderer/bridge";
import { useDispatch } from "LLD/hooks/redux";
import { closeAllModal } from "~/renderer/actions/modals";
import { closePlatformAppDrawer } from "~/renderer/actions/UI";
import { setDrawer } from "~/renderer/drawers/Provider";
import { closeDialog } from "~/renderer/reducers/modularDialog";
import { getAttachedWebview } from "./helpers";
import type { WebviewTag } from "./types";

/**
 * The bridge session of a Live App <webview>. Replies are posted with the session origin as
 * target origin, so Chromium drops them if the guest is on another origin by then. When the
 * main frame moves to another origin, the flows the Live App opened are closed.
 */
export function useWebviewBridgeSession(
  webviewRef: RefObject<WebviewTag | null>,
  mainFrameUrl: string,
): BridgeSessionController {
  const dispatch = useDispatch();

  const postMessage = useCallback(
    (message: string, targetOrigin: string) => {
      getAttachedWebview(webviewRef)?.contentWindow?.postMessage(message, targetOrigin);
    },
    [webviewRef],
  );

  const onReset = useCallback(() => {
    dispatch(closeAllModal());
    dispatch(closePlatformAppDrawer());
    dispatch(closeDialog());
    setDrawer();
  }, [dispatch]);

  const bridge = useBridgeSession({ postMessage, onReset });

  const { onMainFrameNavigation } = bridge;
  useEffect(() => {
    onMainFrameNavigation(mainFrameUrl);
  }, [mainFrameUrl, onMainFrameNavigation]);

  return bridge;
}

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
