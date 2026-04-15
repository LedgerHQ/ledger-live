import type { Account, PostOnboardingAction } from "@ledgerhq/types-live";

type CompletionFields = Pick<PostOnboardingAction, "getIsAlreadyCompletedByState"> & {
  completed: boolean;
};

export function isPostOnboardingHubActionFulfilled(
  action: CompletionFields,
  context: { isLedgerSyncActive: boolean; accounts?: Account[] },
): boolean {
  if (action.completed) return true;
  return Boolean(
    action.getIsAlreadyCompletedByState?.({
      isLedgerSyncActive: !!context.isLedgerSyncActive,
      accounts: context.accounts,
    }),
  );
}
