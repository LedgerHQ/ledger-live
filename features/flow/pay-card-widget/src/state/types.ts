/** Fully persisted across app restarts in the host `payCard` storage blob. */
export type PayCardAnalyticsMilestone =
  | "card-claimed"
  | "card-added-to-os-wallet"
  | "first-card-transaction"
  | "first-card-tx-sync"
  | "card-onboarding-in-progress"
  | "card-onboarding-completed";

export type PayCardOnboardingWidgetPersistedState = Readonly<{
  hasCompletedOnboarding: boolean;
  analyticsCardId: string | null;
  reportedAnalyticsMilestones: readonly PayCardAnalyticsMilestone[];
}>;

export type PayCardOnboardingWidgetState = PayCardOnboardingWidgetPersistedState &
  Readonly<{
    /**
     * When the holder came back from the phone's wallet app, until the provider reports the card
     * there or the wait runs out. Kept in memory only: a restart reads the status afresh anyway.
     */
    digitalWalletProvisioningStartedAt: number | null;
  }>;
