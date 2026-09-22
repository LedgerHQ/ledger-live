/** Fully persisted across app restarts in the host `payCard` storage blob. */
export type PayCardOnboardingWidgetState = Readonly<{
  hasCompletedOnboarding: boolean;
}>;
