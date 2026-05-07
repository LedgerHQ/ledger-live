import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";

/**
 * Same predicate as mobile `checkCanShow` in
 * `apps/ledger-live-mobile/src/hooks/useAutoRedirectToPostOnboarding/useOpenPostOnboardingCallback.ts`:
 * Recover is only relevant after the user has started Ledger Recover (persisted subscription state).
 */
export function hasStartedLedgerRecoverFlowForPostOnboarding(
  state: LedgerRecoverSubscriptionStateEnum | undefined,
): boolean {
  if (state === undefined) {
    return false;
  }
  return (
    state in LedgerRecoverSubscriptionStateInProgressEnum ||
    state === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE
  );
}

/**
 * Portfolio Recover CTA: show only while backup is still in progress.
 * Aligns with mobile hub inclusion (`hasStarted...`) except `BACKUP_DONE`, where the hub may list
 * Recover as completed but the upsell CTA must not appear.
 */
export function shouldShowRecoverPortfolioWidget(
  state: LedgerRecoverSubscriptionStateEnum | undefined,
): boolean {
  return (
    hasStartedLedgerRecoverFlowForPostOnboarding(state) &&
    state !== LedgerRecoverSubscriptionStateEnum.BACKUP_DONE
  );
}
