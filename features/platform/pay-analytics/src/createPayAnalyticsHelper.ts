import type { PayAnalyticsAdapter, PayAnalyticsHelper } from "./types";

export function createPayAnalyticsHelper(adapter: PayAnalyticsAdapter): PayAnalyticsHelper {
  const track = (event: string, properties?: Record<string, unknown>) =>
    adapter.track(event, properties ?? {});

  return {
    trackEvent: track,
    trackButtonClicked: payload => track("button_clicked", payload),
    trackSuccessfulCardLogin: payload => track("successful_card_login", payload),
    trackCardClaimed: () => track("Card claimed"),
    trackCardAddedToOsWallet: () => track("Card added to Apple/google pay"),
    trackCardOnboardingWidgetToggled: ({ opened, ...rest }) =>
      track("button_clicked", {
        button: `card onboarding widget ${opened ? "opened" : "closed"}`,
        ...rest,
      }),
    trackCardOnboardingInProgress: ({ stepsCompleted, ...payload }) =>
      track("card_onboarding_inprogress", {
        ...payload,
        steps_completed: stepsCompleted,
      }),
    trackCardOnboardingCompleted: () => track("card_onboarding_completed"),
    trackFirstCardTransaction: payload => track("first_card_transaction", payload),
    trackDebitOrderChanged: payload => track("debit_order_changed", payload),
    trackFirstCardTxSync: payload => track("first_card_tx_sync", payload),
    trackExperimentationStarted: payload => track("experimentation_started", payload),
    trackRequestVerificationComplete: payload => track("request_verification_complete", payload),
    trackTransactionClicked: payload => track("transaction_clicked", payload),
  };
}
