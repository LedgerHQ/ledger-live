import type { RecoverState } from "~/renderer/screens/recover/Player";
import { DeeplinkHandler } from "../types";

export const recoverHandler: DeeplinkHandler<"recover"> = (route, context) => {
  const { path, search } = route;
  const { navigate, recoverAppId, currentPathname, currentSearch, currentLocationState } = context;
  // When no path (e.g. ledgerwallet://recover), use default Ledger Recover app id from feature flag
  const appId = path || recoverAppId || "";
  const targetPath = `/recover/${appId}`;
  const isSameRecoverRoute = targetPath === currentPathname && search === currentSearch;

  /**
   * useDeepLinkHandler.navigate skips routerNavigate when pathname + search + state are unchanged.
   * Recover email links often repeat the same URL while the user already has Recover open; we still
   * need a navigation + webview remount so the embedded app can advance (see RecoverPlayer key).
   */
  let navigationState: RecoverState | undefined;
  if (isSameRecoverRoute) {
    const prev =
      currentLocationState !== null &&
      currentLocationState !== undefined &&
      typeof currentLocationState === "object" &&
      !Array.isArray(currentLocationState)
        ? { ...currentLocationState }
        : {};
    navigationState = {
      ...prev,
      recoverDeeplinkAt: String(Date.now()),
    };
  }

  navigate(targetPath, navigationState, search);
};

export const recoverRestoreFlowHandler: DeeplinkHandler<"recover-restore-flow"> = (
  _route,
  { navigate },
) => {
  navigate("/recover-restore");
};
