import { withFlagOverrides } from "@tests/test-renderer";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import type { State } from "~/reducers/types";

export const PROTECT_ID = "protect-simu";

export const withBannerEnabled = withFlagOverrides({
  protectServicesMobile: {
    enabled: true,
    params: { bannerSubscriptionNotification: true, protectId: PROTECT_ID },
  },
});

export function withRecoverState(
  subscriptionState: LedgerRecoverSubscriptionStateEnum,
  displayBanner: boolean,
  protectId = PROTECT_ID,
): (state: State) => State {
  return (state: State): State => ({
    ...state,
    recoverState: {
      protectIdState: {
        [protectId]: { subscriptionState, displayBanner },
      },
    },
  });
}
