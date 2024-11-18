import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import {
  TransactionStatus,
  Transaction,
  SolanaAccount,
} from "@ledgerhq/live-common/families/solana/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";

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
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    (memo: string) => {
      onChange(
        bridge.updateTransaction(transaction, {
          model: {
            ...transaction.model,
            uiState: {
              ...transaction.model.uiState,
              memo,
            },
          },
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  const InputField = lldMemoTag?.enabled ? MemoTagField : Input;

  return transaction.model.kind === "transfer" || transaction.model.kind === "token.transfer" ? (
    <InputField
      warning={status.warnings.memo}
      error={status.errors.memo}
      value={transaction.model.uiState.memo || ""}
      onChange={onMemoValueChange}
      placeholder={t("families.solana.memoPlaceholder")}
      autoFocus={autoFocus}
    />
  ) : null;
};
export default MemoValueField;
