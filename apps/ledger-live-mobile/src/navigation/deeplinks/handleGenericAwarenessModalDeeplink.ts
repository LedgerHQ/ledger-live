import { getStateFromPath } from "@react-navigation/native";
import type { AppDispatch } from "~/state-manager/configureStore";
import { openGenericAwarenessModal } from "~/reducers/genericAwarenessModal";

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

  dispatch(
    openGenericAwarenessModal({
      campaignId: searchParams.get("id") ?? undefined,
    }),
  );
  return getStateFromPath("portfolio", config);
}
