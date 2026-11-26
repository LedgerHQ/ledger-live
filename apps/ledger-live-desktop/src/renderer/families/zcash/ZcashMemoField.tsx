import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/coin-zcash/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (transaction: Transaction) => void;
  autoFocus?: boolean;
};

const ZcashMemoField = ({ account, transaction, status, onChange, autoFocus }: Props) => {
  const { t } = useTranslation();
  const bridge = useAccountBridge<Transaction>(account);
  const tx = transaction;

  const onMemoChange = useCallback(
    (memo: string) => {
      onChange(bridge.updateTransaction(tx, { memo }));
    },
    [onChange, bridge, tx],
  );

  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={tx.memo ?? ""}
      onChange={onMemoChange}
      autoFocus={autoFocus}
      label={t("zcash.shielded.send.memo.label")}
      tooltipText={t("zcash.shielded.send.memo.tooltip")}
      placeholder={t("zcash.shielded.send.memo.placeholder")}
    />
  );
};

export default ZcashMemoField;
