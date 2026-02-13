import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getStuckAccountAndOperation } from "@ledgerhq/coin-bitcoin/operation";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo } from "react";
import Box from "~/renderer/components/Box";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const EditStuckTransactionPanelBodyHeader = ({ account, parentAccount }: Props) => {
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  const { enabled: isEditBitcoinTxEnabled, params: bitcoinParams } =
    useFeature("editBitcoinTx") ?? {};
  const isCurrencySupported =
    bitcoinParams?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) ||
    false;

  if (!isEditBitcoinTxEnabled || !isCurrencySupported) {
    return null;
  }
  // check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const stuckAccountAndOperation = getStuckAccountAndOperation(account, parentAccount);

  if (!stuckAccountAndOperation) {
    return null;
  }

  return (
    <Box>
      <EditOperationPanel
        operation={stuckAccountAndOperation.operation}
        account={stuckAccountAndOperation.account}
        parentAccount={stuckAccountAndOperation.parentAccount}
      />
    </Box>
  );
};

export default memo<Props>(EditStuckTransactionPanelBodyHeader);
