import type { Account, PostOnboardingAction } from "@ledgerhq/types-live";

type CompletionFields = Pick<
  PostOnboardingAction,
  "getIsAlreadyCompletedByState" | "getIsAlreadyCompleted"
> & {
  completed: boolean;
};

export type PostOnboardingHubActionCompletionContext = {
  isLedgerSyncActive: boolean;
  accounts?: Account[];
  protectId: string;
  productTourCompleted: boolean;
};

export async function isPostOnboardingHubActionFulfilled(
  action: CompletionFields,
  context: PostOnboardingHubActionCompletionContext,
): Promise<boolean> {
  if (action.completed) return true;

  if (action.getIsAlreadyCompleted) {
    try {
      const isComplete = await action.getIsAlreadyCompleted({ protectId: context.protectId });

      return isComplete;
    } catch {
      return false;
    }
  }

  return Boolean(
    action.getIsAlreadyCompletedByState?.({
      isLedgerSyncActive: !!context.isLedgerSyncActive,
      accounts: context.accounts,
      productTourCompleted: context.productTourCompleted,
    }),
  );
}
