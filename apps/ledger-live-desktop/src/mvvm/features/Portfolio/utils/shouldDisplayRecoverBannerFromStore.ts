import { getStoreValue } from "~/renderer/store";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";

const DEFAULT_PROTECT_ID = "protect-prod";

/**
 * Whether the Recover subscription banner should be shown from persisted Recover state only
 * (subscription in progress and user has not dismissed the banner). Pass `protectId` from
 * `protectServicesDesktop.params.protectId` at the call site so store keys match RecoverBanner / RecoverWidget.
 */
function shouldDisplayRecoverBannerFromStore(protectId: string = DEFAULT_PROTECT_ID): boolean {
  try {
    const subscriptionState = getStoreValue<LedgerRecoverSubscriptionStateEnum>(
      "SUBSCRIPTION_STATE",
      protectId,
    );
    const storedDisplayBanner = getStoreValue<string>("DISPLAY_BANNER", protectId);
    const displayBanner = storedDisplayBanner !== "false";
    const state = subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
    const inProgressSet = new Set<string>(
      Object.values(LedgerRecoverSubscriptionStateInProgressEnum),
    );
    const inProgress = inProgressSet.has(state);
    return inProgress && displayBanner;
  } catch {
    return false;
  }
}

export default shouldDisplayRecoverBannerFromStore;
