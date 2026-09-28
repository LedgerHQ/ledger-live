export interface PayAnalyticsAdapter {
  track: (event: string, properties?: Record<string, unknown>) => void;
}

export type PayGlobalProperties = Record<string, unknown>;

export type PayDebitOrderProperties = Readonly<{
  asset1: string | null;
  asset2: string | null;
  asset3: string | null;
  asset4: string | null;
  asset5: string | null;
}>;

export interface PayAnalyticsHelper {
  trackEvent(event: string, properties?: Record<string, unknown>): void;
  trackButtonClicked(payload: {
    button: string;
    page?: string;
    buttonLocation?: string;
    flow?: string;
    asset?: string;
    currency?: string;
  }): void;
  trackSuccessfulCardLogin(payload: { type: "signin" | "signup" }): void;
  trackCardClaimed(): void;
  trackCardAddedToOsWallet(): void;
  trackCardOnboardingWidgetToggled(payload: {
    opened: boolean;
    page: string;
    cardClaimed: boolean;
    addedToOsWallet: boolean;
    cardTopUp: boolean;
    firstPurchaseCompleted: boolean;
  }): void;
  trackCardOnboardingInProgress(payload: {
    page: string;
    cardClaimed: boolean;
    addedToOsWallet: boolean;
    cardTopUp: boolean;
    firstPurchaseCompleted: boolean;
    stepsCompleted: number;
  }): void;
  trackCardOnboardingCompleted(): void;
  trackFirstCardTransaction(payload: { cardFundSourceAsset: string }): void;
  trackDebitOrderChanged(payload: PayDebitOrderProperties): void;
  trackFirstCardTxSync(payload: { transaction: "in" | "out" }): void;
  trackExperimentationStarted(payload: { feature: string; group: "control" | "version" }): void;
  trackRequestVerificationComplete(payload: {
    flow: "request";
    asset: string;
    network: string;
  }): void;
  trackTransactionClicked(payload: {
    category: "card" | "crypto";
    transaction: string;
    page: string;
    cardFundSourceAsset?: string;
  }): void;
}
