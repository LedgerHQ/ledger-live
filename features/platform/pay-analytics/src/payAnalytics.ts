import { track } from "@shared/analytics";
import { createPayAnalyticsHelper } from "./createPayAnalyticsHelper";

export const {
  trackEvent,
  trackButtonClicked,
  trackSuccessfulCardLogin,
  trackCardClaimed,
  trackCardAddedToOsWallet,
  trackCardOnboardingWidgetToggled,
  trackCardOnboardingInProgress,
  trackCardOnboardingCompleted,
  trackFirstCardTransaction,
  trackDebitOrderChanged,
  trackFirstCardTxSync,
  trackExperimentationStarted,
  trackRequestVerificationComplete,
  trackTransactionClicked,
} = createPayAnalyticsHelper({ track });
