// @flow
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: string => void,
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
}) => {
  const { t } = useTranslation();
  invariant(transaction.family === "solana", "Memo: solana family expected");

  const bridge = getAccountBridge(account);

  const onMemoValueChange = useCallback(
    memo => {
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

  return (
    <Input
      warning={status.warnings.memo}
      error={status.errors.memo}
      value={transaction.model.uiState.memo || ""}
      onChange={onMemoValueChange}
      placeholder={t("families.solana.memoPlaceholder")}
    />
  );
};

export default MemoValueField;
