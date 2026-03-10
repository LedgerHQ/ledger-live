import { useCallback } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

type Params = {
  onChangeAccount: (nextAccount?: AccountLike | null, nextParentAccount?: Account | null) => void;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
};

export const useHandleChangeAccount = ({ onChangeAccount, updateTransaction }: Params) => {
  return useCallback(
    (nextAcc?: AccountLike | null, nextParentAcc?: Account | null) => {
      if (!nextAcc) return;
      onChangeAccount(nextAcc, nextParentAcc);
      const nextMainAccount = getMainAccount(nextAcc, nextParentAcc);
      updateTransaction(tx => ({ ...tx, recipient: nextMainAccount.freshAddress }));
    },
    [onChangeAccount, updateTransaction],
  );
};
