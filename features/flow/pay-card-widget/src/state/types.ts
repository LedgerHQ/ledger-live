/** Fully persisted across app restarts in the host `payCard` storage blob. */
export type PayCardAnalyticsMilestone =
  | "card-claimed"
  | "card-added-to-os-wallet"
  | "first-card-transaction"
  | "first-card-tx-sync"
  | "card-onboarding-in-progress"
  | "card-onboarding-completed";

export type PayCardOnboardingWidgetState = Readonly<{
  hasCompletedOnboarding: boolean;
  analyticsCardId: string | null;
  reportedAnalyticsMilestones: readonly PayCardAnalyticsMilestone[];
}>;
