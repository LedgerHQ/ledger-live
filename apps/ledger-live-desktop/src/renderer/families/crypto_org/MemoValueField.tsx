import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import {
  CryptoOrgAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/crypto_org/types";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: (t: Transaction) => void;
  account: CryptoOrgAccount;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  const { t } = useTranslation();
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    memo => {
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // It will be usefull to block a memo wrong format
  // on the ledger-live mobile
  return (
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo as string | undefined} // FIXME: Should we change it ?
      onChange={onMemoValueChange}
      placeholder={t("cryptoOrg.memoPlaceholder")}
    />
  );
};
export default MemoValueField;
