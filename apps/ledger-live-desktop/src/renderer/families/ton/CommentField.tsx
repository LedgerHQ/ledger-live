import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ton/types";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import Input from "~/renderer/components/Input";

const CommentField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: (a: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  invariant(transaction.family === "ton", "Comment: TON family expected");

  const { t } = useTranslation();

  const bridge = getAccountBridge(account);

  const onCommentFieldChange = useCallback(
    (value: string) => {
      onChange(
        bridge.updateTransaction(transaction, {
          comment: { isEncrypted: false, text: value ?? "" },
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <Input
      warning={status.warnings.comment}
      error={status.errors.comment}
      value={transaction.comment.text}
      placeholder={t("families.ton.commentPlaceholder")}
      onChange={onCommentFieldChange}
      spellCheck="false"
    />
  );
};

export default CommentField;
