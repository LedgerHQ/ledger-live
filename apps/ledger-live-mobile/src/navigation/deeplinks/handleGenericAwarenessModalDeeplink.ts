import { getStateFromPath } from "@react-navigation/native";
import type { AppDispatch } from "~/state-manager/configureStore";
import { setGenericAwarenessModalCampaignId } from "~/reducers/genericAwarenessModal";

export function handleGenericAwarenessModalDeeplink({
  isGenericAwarenessModalEnabled,
  hasCompletedOnboarding,
  searchParams,
  dispatch,
  config,
}: {
  isGenericAwarenessModalEnabled: boolean;
  hasCompletedOnboarding: boolean;
  searchParams: URLSearchParams;
  dispatch: AppDispatch;
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  if (!isGenericAwarenessModalEnabled) return undefined;
  if (!hasCompletedOnboarding) return undefined;
  const campaignId = searchParams.get("id");
  if (!campaignId) return undefined;

  dispatch(setGenericAwarenessModalCampaignId(campaignId));

  return getStateFromPath("portfolio", config);
}
