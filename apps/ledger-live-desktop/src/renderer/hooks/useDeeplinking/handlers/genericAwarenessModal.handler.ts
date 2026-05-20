import { openGenericAwarenessModal } from "LLD/features/GenericAwarenessModal/genericAwarenessModal";
import { DeeplinkHandler } from "../types";

export const genericAwarenessModalHandler: DeeplinkHandler<"generic-awareness-modal"> = (
  route,
  { dispatch, hasCompletedOnboarding, isGenericAwarenessModalEnabled },
) => {
  if (!hasCompletedOnboarding || !isGenericAwarenessModalEnabled) {
    return;
  }

  dispatch(openGenericAwarenessModal({ campaignId: route.id }));
};
