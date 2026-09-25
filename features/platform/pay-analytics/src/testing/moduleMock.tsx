/**
 * Test double for `@features/platform-pay-analytics`, mapped by default in the features/flow jest
 * projects. Tracking calls land on `jest.fn()`s a test can assert on, and `PayTrackPage` records
 * its props instead of reaching the real page components — `TrackScreen` needs a navigation
 * container, which a view rendered on its own does not have.
 */
import type { PayTrackPageProps } from "../PayTrackPage.types";

export * from "../types";
export * from "../constants";
export * from "../PayTrackPage.types";
export * from "../toPayGlobalProperties";
export * from "../toPayDebitOrderProperties";
export * from "../getTickersWithFunds";

export const trackEvent = jest.fn();
export const trackButtonClicked = jest.fn();
export const trackSuccessfulCardLogin = jest.fn();
export const trackCardClaimed = jest.fn();
export const trackCardAddedToOsWallet = jest.fn();
export const trackCardOnboardingWidgetToggled = jest.fn();
export const trackCardOnboardingInProgress = jest.fn();
export const trackCardOnboardingCompleted = jest.fn();
export const trackFirstCardTransaction = jest.fn();
export const trackDebitOrderChanged = jest.fn();
export const trackFirstCardTxSync = jest.fn();
export const trackExperimentationStarted = jest.fn();
export const trackRequestVerificationComplete = jest.fn();
export const trackTransactionClicked = jest.fn();

export const PayTrackPage = jest.fn((_props: PayTrackPageProps) => null);

/** The props of every `PayTrackPage` currently or previously rendered, oldest first. */
export function trackedPages(): PayTrackPageProps[] {
  return PayTrackPage.mock.calls.map(([props]) => props);
}
