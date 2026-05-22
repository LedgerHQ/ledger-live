import { openGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { DeeplinkHandler } from "../types";

export const genericAwarenessModalHandler: DeeplinkHandler<"generic-awareness-modal"> = (
  route,
  { dispatch, hasCompletedOnboarding, isGenericAwarenessModalEnabled },
) => {
  if (!hasCompletedOnboarding || !isGenericAwarenessModalEnabled) {
    return;
  }

  dispatch(openGenericAwarenessModalDialog({ campaignId: route.id }));
};
