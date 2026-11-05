import type { DeeplinkHandler } from "../types";

const PREDICTIONS_PATH = "/predictions";

export const predictionsHandler: DeeplinkHandler<"predictions"> = (
  route,
  { navigate, isPredictionsAvailable, currentPathname, currentLocationState },
) => {
  if (!isPredictionsAvailable) return;

  const isPredictionsOpen = currentPathname.startsWith(PREDICTIONS_PATH);
  const returnTo = isPredictionsOpen
    ? (currentLocationState as { returnTo?: string } | null)?.returnTo
    : currentPathname;

  navigate(PREDICTIONS_PATH, { ...route.query, returnTo });
};
