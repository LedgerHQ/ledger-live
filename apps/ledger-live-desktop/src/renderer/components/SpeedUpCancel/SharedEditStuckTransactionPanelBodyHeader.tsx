import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import React from "react";
import Box from "~/renderer/components/Box";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";

type StuckAccountAndOperation = {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

type Props = {
  isEditTxEnabled: boolean;
  isCurrencySupported: boolean;
  stuckAccountAndOperation: StuckAccountAndOperation | null | undefined;
};

export const SharedEditStuckTransactionPanelBodyHeader = ({
  isEditTxEnabled,
  isCurrencySupported,
  stuckAccountAndOperation,
}: Props) => {
  if (!isEditTxEnabled || !isCurrencySupported || !stuckAccountAndOperation) {
    return null;
  }

  return (
    <Box>
      <EditOperationPanel
        operation={stuckAccountAndOperation.operation}
        account={stuckAccountAndOperation.account}
        parentAccount={stuckAccountAndOperation.parentAccount ?? undefined}
      />
    </Box>
  );
};
