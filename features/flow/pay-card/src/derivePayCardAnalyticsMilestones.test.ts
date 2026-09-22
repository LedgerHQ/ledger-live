import type { PayCardStatus, PayCardTransaction } from "@domain/api-card-management";
import type { CardOnboardingStatus } from "@features/flow-pay-card-widget/onboarding-status";
import { derivePayCardAnalyticsMilestones } from "./derivePayCardAnalyticsMilestones";

describe("derivePayCardAnalyticsMilestones", () => {
  it("derives provider-backed card milestones", () => {
    const milestones = derivePayCardAnalyticsMilestones({
      cardStatus: { cardAddedToDigitalWallet: true } as PayCardStatus,
    });

    expect(milestones).toEqual(
      expect.arrayContaining([{ id: "card-claimed" }, { id: "card-added-to-os-wallet" }]),
    );
  });

  it("maps the first synchronized transaction to the tracking contract", () => {
    const milestones = derivePayCardAnalyticsMilestones({
      transactions: [
        {
          sign: "CREDIT",
          fundingSources: [{ currency: "usdc" }],
        } as PayCardTransaction,
      ],
    });

    expect(milestones).toEqual(
      expect.arrayContaining([
        { id: "first-card-transaction", cardFundSourceAsset: "USDC" },
        { id: "first-card-tx-sync", transaction: "in" },
      ]),
    );
  });

  it("does not infer the first transaction from a paginated multi-transaction response", () => {
    const transaction = {
      sign: "DEBIT",
      fundingSources: [{ currency: "USDC" }],
    } as PayCardTransaction;

    expect(
      derivePayCardAnalyticsMilestones({ transactions: [transaction, transaction] }),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "first-card-transaction" }),
        expect.objectContaining({ id: "first-card-tx-sync" }),
      ]),
    );
  });

  it("reports the current onboarding state", () => {
    const milestones = derivePayCardAnalyticsMilestones({
      onboardingStatus: {
        completedCount: 2,
        steps: [
          { id: "choose-card-type", isDone: true },
          { id: "top-up-card", isDone: true },
          { id: "first-purchase", isDone: false },
        ],
      } as CardOnboardingStatus,
    });

    expect(milestones).toContainEqual({
      id: "card-onboarding-in-progress",
      cardClaimed: true,
      addedToOsWallet: false,
      cardTopUp: true,
      firstPurchaseCompleted: false,
      stepsCompleted: 2,
    });
  });

  it("treats a completed phone-wallet onboarding step as added to the OS wallet", () => {
    const milestones = derivePayCardAnalyticsMilestones({
      onboardingStatus: {
        completedCount: 1,
        steps: [{ id: "apple-google-pay", isDone: true }],
      } as CardOnboardingStatus,
    });

    expect(milestones).toEqual(
      expect.arrayContaining([
        { id: "card-added-to-os-wallet" },
        expect.objectContaining({
          id: "card-onboarding-completed",
        }),
      ]),
    );
  });
});
