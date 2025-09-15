import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

const CommentField = ({
  onChange,
  account,
  transaction,
  status,
  autoFocus,
}: {
  onChange: (a: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  autoFocus?: boolean;
}) => {
  invariant(transaction.family === "canton", "Comment: Canton family expected");

  const { t } = useTranslation();

  const bridge = getAccountBridge(account);

  const onCommentFieldChange = useCallback(
    (value: string) => {
      onChange(
        bridge.updateTransaction(transaction, {
          memo: value ?? "",
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo}
      placeholder={t("families.canton.commentPlaceholder")}
      onChange={onCommentFieldChange}
      spellCheck="false"
      autoFocus={autoFocus}
    />
  );
};

export default CommentField;
