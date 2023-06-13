import React, { memo } from "react";
import Box from "~/renderer/components/Box";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import invariant from "invariant";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const EditStuckTransactionPanelBodyHeader = (props: Props) => {
  const { account, parentAccount } = props;
  const editEthTx = useFeature("editEthTx");
  if (!editEthTx?.enabled) {
    return null;
  }
  invariant(account, "account required");
  // for ethereum family, check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const stuckAccountAndOperation = getStuckAccountAndOperation(account, parentAccount);
  return (
    <Box>
      {stuckAccountAndOperation ? (
        <EditOperationPanel
          operation={stuckAccountAndOperation.operation}
          account={stuckAccountAndOperation.account}
          parentAccount={stuckAccountAndOperation.parentAccount}
        />
      ) : null}
    </Box>
  );
};

export default memo<Props>(EditStuckTransactionPanelBodyHeader);
