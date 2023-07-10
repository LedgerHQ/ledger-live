import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";
import { useTranslation } from "react-i18next";

type Props = {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
};

const MemoValueField = ({ onChange, account, transaction, status }: Props) => {
  invariant(transaction.family === "stacks", "MemoField: stacks family expected");

  const { t } = useTranslation();

  const bridge = getAccountBridge(account);

  const onMemoValueChange = useCallback(
    memoValue => {
      onChange(bridge.updateTransaction(transaction, { memo: memoValue }));
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
      value={transaction.memo}
      placeholder={t("families.stacks.memoPlaceholder")}
      onChange={onMemoValueChange}
    />
  );
};

export default MemoValueField;
