import type { Account, PostOnboardingAction } from "@ledgerhq/types-live";

type CompletionFields = Pick<
  PostOnboardingAction,
  "getIsAlreadyCompletedByState" | "getIsAlreadyCompleted"
> & {
  completed: boolean;
};

export async function isPostOnboardingHubActionFulfilled(
  action: CompletionFields,
  context: { isLedgerSyncActive: boolean; accounts?: Account[]; protectId: string },
): Promise<boolean> {
  if (action.completed) return true;

  if (action.getIsAlreadyCompleted) {
    const isComplete = await action.getIsAlreadyCompleted({ protectId: context.protectId });
    return isComplete;
  }

  return Boolean(
    action.getIsAlreadyCompletedByState?.({
      isLedgerSyncActive: !!context.isLedgerSyncActive,
      accounts: context.accounts,
    }),
  );
}
