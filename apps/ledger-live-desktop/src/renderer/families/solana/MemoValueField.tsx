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

type Props = {
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  account: SolanaAccount;
};

const MemoValueField = ({ onChange, account, transaction, status }: Props) => {
  const { t } = useTranslation();
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
  return transaction.model.kind === "transfer" || transaction.model.kind === "token.transfer" ? (
    <Input
      warning={status.warnings.memo}
      error={status.errors.memo}
      value={transaction.model.uiState.memo || ""}
      onChange={onMemoValueChange}
      placeholder={t("families.solana.memoPlaceholder")}
    />
  ) : null;
};
export default MemoValueField;
