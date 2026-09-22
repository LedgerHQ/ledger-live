import { createPayAnalyticsHelper } from "../createPayAnalyticsHelper";
import type { PayAnalyticsAdapter } from "../types";

function createAdapter(): PayAnalyticsAdapter & { track: jest.Mock } {
  return {
    track: jest.fn(),
  };
}

describe("createPayAnalyticsHelper", () => {
  it("tracks button_clicked for trackButtonClicked", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackButtonClicked({ button: "Add funds", page: "Pay" });

    expect(adapter.track).toHaveBeenCalledWith("button_clicked", {
      button: "Add funds",
      page: "Pay",
    });
  });

  it("tracks successful_card_login for trackSuccessfulCardLogin", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackSuccessfulCardLogin({ type: "signin" });

    expect(adapter.track).toHaveBeenCalledWith("successful_card_login", { type: "signin" });
  });

  it("tracks 'Card claimed' with no payload for trackCardClaimed", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardClaimed();

    expect(adapter.track).toHaveBeenCalledWith("Card claimed", {});
  });

  it("tracks 'Card added to Apple/google pay' for trackCardAddedToOsWallet", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardAddedToOsWallet();

    expect(adapter.track).toHaveBeenCalledWith("Card added to Apple/google pay", {});
  });

  it("translates trackCardOnboardingWidgetToggled(opened: true) to a button_clicked 'opened' event", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardOnboardingWidgetToggled({
      opened: true,
      page: "Pay",
      cardClaimed: false,
      addedToOsWallet: false,
      cardTopUp: false,
      firstPurchaseCompleted: false,
    });

    expect(adapter.track).toHaveBeenCalledWith("button_clicked", {
      button: "card onboarding widget opened",
      page: "Pay",
      cardClaimed: false,
      addedToOsWallet: false,
      cardTopUp: false,
      firstPurchaseCompleted: false,
    });
  });

  it("translates trackCardOnboardingWidgetToggled(opened: false) to a button_clicked 'closed' event", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardOnboardingWidgetToggled({
      opened: false,
      page: "Pay",
      cardClaimed: true,
      addedToOsWallet: true,
      cardTopUp: true,
      firstPurchaseCompleted: true,
    });

    expect(adapter.track).toHaveBeenCalledWith("button_clicked", {
      button: "card onboarding widget closed",
      page: "Pay",
      cardClaimed: true,
      addedToOsWallet: true,
      cardTopUp: true,
      firstPurchaseCompleted: true,
    });
  });

  it("tracks card_onboarding_inprogress for trackCardOnboardingInProgress", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardOnboardingInProgress({
      page: "Pay",
      cardClaimed: true,
      addedToOsWallet: false,
      cardTopUp: false,
      firstPurchaseCompleted: false,
      stepsCompleted: 1,
    });

    expect(adapter.track).toHaveBeenCalledWith("card_onboarding_inprogress", {
      page: "Pay",
      cardClaimed: true,
      addedToOsWallet: false,
      cardTopUp: false,
      firstPurchaseCompleted: false,
      steps_completed: 1,
    });
  });

  it("tracks card_onboarding_completed with no payload for trackCardOnboardingCompleted", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackCardOnboardingCompleted();

    expect(adapter.track).toHaveBeenCalledWith("card_onboarding_completed", {});
  });

  it("tracks first_card_transaction for trackFirstCardTransaction", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackFirstCardTransaction({ cardFundSourceAsset: "USDC" });

    expect(adapter.track).toHaveBeenCalledWith("first_card_transaction", {
      cardFundSourceAsset: "USDC",
    });
  });

  it("tracks debit_order_changed for trackDebitOrderChanged", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackDebitOrderChanged({
      asset1: "USDC",
      asset2: "BTC",
      asset3: null,
      asset4: null,
      asset5: null,
    });

    expect(adapter.track).toHaveBeenCalledWith("debit_order_changed", {
      asset1: "USDC",
      asset2: "BTC",
      asset3: null,
      asset4: null,
      asset5: null,
    });
  });

  it("tracks first_card_tx_sync for trackFirstCardTxSync", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackFirstCardTxSync({ transaction: "in" });

    expect(adapter.track).toHaveBeenCalledWith("first_card_tx_sync", { transaction: "in" });
  });

  it("tracks experimentation_started for trackExperimentationStarted", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackExperimentationStarted({ feature: "pay_tab", group: "version" });

    expect(adapter.track).toHaveBeenCalledWith("experimentation_started", {
      feature: "pay_tab",
      group: "version",
    });
  });

  it("tracks request_verification_complete for trackRequestVerificationComplete", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackRequestVerificationComplete({ flow: "request", asset: "BTC", network: "bitcoin" });

    expect(adapter.track).toHaveBeenCalledWith("request_verification_complete", {
      flow: "request",
      asset: "BTC",
      network: "bitcoin",
    });
  });

  it("tracks transaction_clicked for trackTransactionClicked", () => {
    const adapter = createAdapter();
    const helper = createPayAnalyticsHelper(adapter);

    helper.trackTransactionClicked({ category: "card", transaction: "tx-1", page: "Pay" });

    expect(adapter.track).toHaveBeenCalledWith("transaction_clicked", {
      category: "card",
      transaction: "tx-1",
      page: "Pay",
    });
  });
});
