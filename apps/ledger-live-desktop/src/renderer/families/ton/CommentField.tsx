import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ton/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";
import Input from "~/renderer/components/Input";

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
  invariant(transaction.family === "ton", "Comment: TON family expected");

  const { t } = useTranslation();

  const bridge = getAccountBridge(account);
  const lldMemoTag = useFeature("lldMemoTag");

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

  const InputField = lldMemoTag?.enabled ? MemoTagField : Input;

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <InputField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.comment.text}
      placeholder={t("families.ton.commentPlaceholder")}
      onChange={onCommentFieldChange}
      spellCheck="false"
      autoFocus={autoFocus}
    />
  );
};

export default CommentField;
