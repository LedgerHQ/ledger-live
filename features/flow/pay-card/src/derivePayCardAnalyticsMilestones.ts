import type { PayCardStatus, PayCardTransaction } from "@domain/api-card-management";
import type { CardOnboardingStatus } from "@features/flow-pay-card-widget/onboarding-status";

export type PendingPayCardAnalyticsMilestone =
  | { readonly id: "card-claimed" }
  | { readonly id: "card-added-to-os-wallet" }
  | { readonly id: "first-card-transaction"; readonly cardFundSourceAsset: string }
  | { readonly id: "first-card-tx-sync"; readonly transaction: "in" | "out" }
  | { readonly id: "card-onboarding-completed" }
  | {
      readonly id: "card-onboarding-in-progress";
      readonly cardClaimed: boolean;
      readonly addedToOsWallet: boolean;
      readonly cardTopUp: boolean;
      readonly firstPurchaseCompleted: boolean;
      readonly stepsCompleted: number;
    };

type Inputs = Readonly<{
  cardStatus?: PayCardStatus;
  transactions?: readonly PayCardTransaction[];
  onboardingStatus?: CardOnboardingStatus;
}>;

export function derivePayCardAnalyticsMilestones({
  cardStatus,
  transactions,
  onboardingStatus,
}: Inputs): readonly PendingPayCardAnalyticsMilestone[] {
  const milestones: PendingPayCardAnalyticsMilestone[] = [];
  const stepDone = (id: string) =>
    onboardingStatus?.steps.find(step => step.id === id)?.isDone ?? false;

  if (cardStatus) {
    milestones.push({ id: "card-claimed" });
  }

  if (cardStatus?.cardAddedToDigitalWallet || stepDone("apple-google-pay")) {
    milestones.push({ id: "card-added-to-os-wallet" });
  }

  const firstTransaction = transactions?.length === 1 ? transactions[0] : undefined;
  if (firstTransaction) {
    const cardFundSourceAsset = firstTransaction.fundingSources?.[0]?.currency?.toUpperCase();

    if (cardFundSourceAsset) {
      milestones.push({
        id: "first-card-transaction",
        cardFundSourceAsset,
      });
    }

    milestones.push({
      id: "first-card-tx-sync",
      transaction: firstTransaction.sign === "CREDIT" ? "in" : "out",
    });
  }

  if (onboardingStatus?.steps.length) {
    const completed = onboardingStatus.completedCount === onboardingStatus.steps.length;

    milestones.push(
      completed
        ? { id: "card-onboarding-completed" }
        : {
            id: "card-onboarding-in-progress",
            cardClaimed: stepDone("choose-card-type"),
            addedToOsWallet:
              cardStatus?.cardAddedToDigitalWallet === true || stepDone("apple-google-pay"),
            cardTopUp: stepDone("top-up-card"),
            firstPurchaseCompleted: stepDone("first-purchase"),
            stepsCompleted: onboardingStatus.completedCount,
          },
    );
  }

  return milestones;
}
