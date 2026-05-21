import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import { getMockGenericAwarenessModalBrazeCards } from "./getMockGenericAwarenessModalBrazeCards";

/** Processed content cards from {@link getMockGenericAwarenessModalBrazeCards}. */
export const getMockGenericAwarenessModalContentCards = () =>
  processGenericAwarenessModalBrazeCards(getMockGenericAwarenessModalBrazeCards());
