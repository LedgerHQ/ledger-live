import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  AccountBridge,
  AccountLike,
  Account,
  TransactionCommon,
  TransactionEditType,
} from "@ledgerhq/types-live";
import invariant from "invariant";
import { useCallback } from "react";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

type UseStepMethodSelectionParams = {
  haveFundToSpeedup: boolean;
  haveFundToCancel: boolean;
  isOldestEditableOperation: boolean;
  setEditType: (editType: TransactionEditType) => void;
  learnMoreUrl: string;
};

export const useStepMethodSelection = ({
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  setEditType,
  learnMoreUrl,
}: UseStepMethodSelectionParams) => {
  const canSpeedup = haveFundToSpeedup && isOldestEditableOperation;
  const canCancel = haveFundToCancel;
  const localizedLearnMoreUrl = useLocalizedUrl(learnMoreUrl);

  const handleSpeedupClick = useCallback(() => {
    if (canSpeedup) {
      setEditType("speedup");
    }
  }, [canSpeedup, setEditType]);

  const handleCancelClick = useCallback(() => {
    if (canCancel) {
      setEditType("cancel");
    }
  }, [canCancel, setEditType]);

  const handleLearnMoreClick = useCallback(() => {
    if (localizedLearnMoreUrl) {
      openURL(localizedLearnMoreUrl);
    }
  }, [localizedLearnMoreUrl]);

  return {
    canSpeedup,
    canCancel,
    handleSpeedupClick,
    handleCancelClick,
    handleLearnMoreClick,
  };
};

type UseStepMethodContinueParams<T extends TransactionCommon> = {
  editType?: TransactionEditType;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transactionToUpdate: T;
  updateTransaction: (updater: (tx: T) => T) => void;
  transitionTo: (step: string) => void;
  getPatch: (args: {
    account: Account;
    transaction: T;
    editType: TransactionEditType;
  }) => Promise<Parameters<AccountBridge<T>["updateTransaction"]>[1]>;
};

export const useStepMethodContinue = <T extends TransactionCommon>({
  editType,
  account,
  parentAccount,
  transactionToUpdate,
  updateTransaction,
  transitionTo,
  getPatch,
}: UseStepMethodContinueParams<T>) => {
  return useCallback(async () => {
    invariant(editType, "editType required");

    const bridge: AccountBridge<T> = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    const patch = await getPatch({
      account: mainAccount,
      transaction: transactionToUpdate,
      editType,
    });

    updateTransaction(tx => bridge.updateTransaction(tx, patch));
    transitionTo("summary");
  }, [
    editType,
    account,
    parentAccount,
    getPatch,
    transactionToUpdate,
    transitionTo,
    updateTransaction,
  ]);
};
