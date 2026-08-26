import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { EARN_GO_TO_DASHBOARD_EVENT } from "./constants";
import { isOnEarnDashboard } from "./isOnEarnDashboard";

/**
 * Handles the sidebar asking for a dashboard reset. `resetKey` remounts the Earn live app, which is
 * the only reliable way to move it: it navigates inside the webview without the host knowing, so
 * recomputing the same `src` would be a no-op prop update. Tracking the webview URL lets us skip
 * that reload when the app already sits on its dashboard.
 */
export const useDashboardReset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resetKey, setResetKey] = useState(0);
  const webviewUrlRef = useRef<string | undefined>(undefined);

  const onWebviewStateChange = useCallback((state: WebviewState) => {
    webviewUrlRef.current = state.url;
  }, []);

  const hasRouteState = !!location.state && Object.keys(location.state).length > 0;

  useEffect(() => {
    const handler = () => {
      // Deeplink params must go even when no reload is needed, otherwise a later input change
      // (theme, discreet mode) would recompute the webview src and replay the deposit flow.
      if (hasRouteState) {
        navigate("/earn", { replace: true, state: null });
      }

      if (isOnEarnDashboard(webviewUrlRef.current)) {
        return;
      }

      setResetKey(key => key + 1);
    };

    globalThis.addEventListener(EARN_GO_TO_DASHBOARD_EVENT, handler);
    return () => globalThis.removeEventListener(EARN_GO_TO_DASHBOARD_EVENT, handler);
  }, [navigate, hasRouteState]);

  return { resetKey, onWebviewStateChange };
};
