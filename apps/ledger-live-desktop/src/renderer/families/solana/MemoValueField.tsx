import {
  getTransactionMemo,
  isTransferTransaction,
  setTransactionMemo,
} from "@ledgerhq/live-common/families/solana/transactions";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import {
  TransactionStatus,
  Transaction,
  SolanaAccount,
} from "@ledgerhq/live-common/families/solana/types";
import { useFeature } from "@features/platform-feature-flags";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

type Props = {
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  account: SolanaAccount;
  autoFocus?: boolean;
};

const MemoValueField = ({ onChange, account, transaction, status, autoFocus }: Props) => {
  const { t } = useTranslation();
  const lldMemoTag = useFeature("lldMemoTag");

  invariant(transaction.family === "solana", "Memo: solana family expected");
  const bridge = useAccountBridge<Transaction>(account);
  const onMemoValueChange = useCallback(
    (memo: string) => {
      onChange(bridge.updateTransaction(transaction, setTransactionMemo(memo)));
    },
    [onChange, transaction, bridge],
  );

  const InputField = lldMemoTag?.enabled ? MemoTagField : Input;
  const isRecipientMemoRequired = status?.errors?.memo?.name === "SolanaRecipientMemoIsRequired";

  return isTransferTransaction(transaction) ? (
    <InputField
      warning={status.warnings.memo}
      error={status.errors.transaction ?? status.errors.memo}
      value={getTransactionMemo(transaction)}
      onChange={onMemoValueChange}
      placeholder={t(
        isRecipientMemoRequired
          ? "families.solana.requiredMemoPlaceholder"
          : "families.solana.memoPlaceholder",
      )}
      autoFocus={autoFocus}
    />
  ) : null;
};
export default MemoValueField;
