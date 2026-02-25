import { DeeplinkHandler } from "../types";

export const recoverHandler: DeeplinkHandler<"recover"> = (route, { navigate }) => {
  const { path, search } = route;
  navigate(`/recover/${path}`, undefined, search);
};

export const recoverRestoreFlowHandler: DeeplinkHandler<"recover-restore-flow"> = (
  _route,
  { navigate },
) => {
  navigate("/recover-restore");
};
