import { type RefObject, useCallback, useEffect } from "react";
import {
  type BridgeSession,
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
 * main frame moves to another origin, the flows the Live App opened are closed: nothing is
 * closed when the session opened none, so the modals, drawers and dialogs of the app stay open
 * (e.g. when the Live App redirects while it loads).
 *
 * `closeUnopenedFlows` closes them anyway, for the Platform API, whose handlers open their
 * flows without going through the session.
 */
export function useWebviewBridgeSession(
  webviewRef: RefObject<WebviewTag | null>,
  mainFrameUrl: string,
  { closeUnopenedFlows = false }: { closeUnopenedFlows?: boolean } = {},
): BridgeSessionController {
  const dispatch = useDispatch();

  const postMessage = useCallback(
    (message: string, targetOrigin: string) => {
      getAttachedWebview(webviewRef)?.contentWindow?.postMessage(message, targetOrigin);
    },
    [webviewRef],
  );

  const onReset = useCallback(
    (closedSession: BridgeSession) => {
      if (!closeUnopenedFlows && !closedSession.hasOpenedUiFlow) return;
      dispatch(closeAllModal());
      dispatch(closePlatformAppDrawer());
      dispatch(closeDialog());
      setDrawer();
    },
    [dispatch, closeUnopenedFlows],
  );

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
