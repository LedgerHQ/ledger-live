import { DeeplinkHandler } from "../types";

export const recoverHandler: DeeplinkHandler<"recover"> = (route, { navigate, recoverAppId }) => {
  const { path, search } = route;
  // When no path (e.g. ledgerwallet://recover), use default Ledger Recover app id from feature flag
  const appId = path || recoverAppId || "";
  navigate(`/recover/${appId}`, undefined, search);
};

export const recoverRestoreFlowHandler: DeeplinkHandler<"recover-restore-flow"> = (
  _route,
  { navigate },
) => {
  navigate("/recover-restore");
};
