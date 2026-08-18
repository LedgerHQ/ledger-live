import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";

function parseExchangeBackPath(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null || !("returnTo" in state)) {
    return undefined;
  }

  return typeof state.returnTo === "string" && state.returnTo !== "" ? state.returnTo : undefined;
}

export function useExchangeBackNavigation(): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  // Keep returnTo and the depth in refs so they survive in-webview navigations that overwrite
  // location.state, letting a single "back" pop the whole Exchange segment instead of a duplicate.
  const returnToRef = useRef(parseExchangeBackPath(location.state));
  const previousLocationKeyRef = useRef(location.key);
  const exchangeHistoryDepthRef = useRef(1);

  useEffect(() => {
    returnToRef.current ??= parseExchangeBackPath(location.state);

    if (previousLocationKeyRef.current === location.key) {
      return;
    }

    if (navigationType === "PUSH") {
      exchangeHistoryDepthRef.current += 1;
    } else if (navigationType === "POP") {
      exchangeHistoryDepthRef.current = Math.max(1, exchangeHistoryDepthRef.current - 1);
    }

    previousLocationKeyRef.current = location.key;
  }, [location.key, location.state, navigationType]);

  return useCallback(() => {
    if (!returnToRef.current) {
      navigate("/", { replace: true });
      return;
    }

    navigate(-exchangeHistoryDepthRef.current);
  }, [navigate]);
}
