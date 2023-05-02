import React from "react";
import Box from "~/renderer/components/Box";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";
import { getEthStuckAccountAndOperation } from "@ledgerhq/live-common/operation";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
};

const EditStuckTransactionPanelBodyHeader = (props: Props) => {
  const { account, parentAccount } = props;
  const editEthTx = useFeature("editEthTx");
  if (!editEthTx?.enabled) {
    return null;
  }
  // for ethereum family, check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const [stuckAccount, stuckParentAccount, stuckOperation] = getEthStuckAccountAndOperation(
    account,
    parentAccount,
  );
  return (
    <Box>
      {stuckOperation && stuckAccount ? (
        <EditOperationPanel
          operation={stuckOperation}
          account={stuckAccount}
          parentAccount={stuckParentAccount}
        />
      ) : null}
    </Box>
  );
};

export default EditStuckTransactionPanelBodyHeader;
