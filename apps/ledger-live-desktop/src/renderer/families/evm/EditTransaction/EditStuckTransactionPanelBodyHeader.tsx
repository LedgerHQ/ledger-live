import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo, useState, useEffect } from "react";
import { SharedEditStuckTransactionPanelBodyHeader } from "~/renderer/components/SpeedUpCancel";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const EditStuckTransactionPanelBodyHeader = ({ account, parentAccount }: Props) => {
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) || false;

  const [stuckAccountAndOperation, setStuckAccountAndOperation] = useState<
    Awaited<ReturnType<typeof getStuckAccountAndOperation>>
  >(undefined);

  useEffect(() => {
    if (!isEditEvmTxEnabled || !isCurrencySupported) return;
    getStuckAccountAndOperation(account, parentAccount).then(setStuckAccountAndOperation);
  }, [account, parentAccount, isEditEvmTxEnabled, isCurrencySupported]);

  if (!isEditEvmTxEnabled || !isCurrencySupported) {
    return null;
  }

  return (
    <SharedEditStuckTransactionPanelBodyHeader
      isEditTxEnabled={!!isEditEvmTxEnabled}
      isCurrencySupported={isCurrencySupported}
      stuckAccountAndOperation={stuckAccountAndOperation}
    />
  );
};

export default memo<Props>(EditStuckTransactionPanelBodyHeader);
