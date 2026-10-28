import { PREDICTIONS_LIVE_APP_ID } from "@features/platform-predictions";
import type { DeeplinkHandler } from "../types";

export const predictionsHandler: DeeplinkHandler<"predictions"> = (
  route,
  { navigate, isPredictionsAvailable },
) => {
  if (!isPredictionsAvailable) return;

  navigate(`/platform/${PREDICTIONS_LIVE_APP_ID}`, route.query);
};
