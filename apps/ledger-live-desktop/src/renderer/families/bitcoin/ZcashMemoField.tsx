import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashTransaction } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

// Memo can only be attached to shielded outputs (512 bytes max, ZIP-302).
const MAX_MEMO_LENGTH = 512;

type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (transaction: Transaction) => void;
  autoFocus?: boolean;
};

const ZcashMemoField = ({ account, transaction, status, onChange, autoFocus }: Props) => {
  const { t } = useTranslation();
  const bridge = useAccountBridge<ZcashTransaction>(account);
  const tx = transaction as ZcashTransaction;

  const onMemoChange = useCallback(
    (memo: string) => {
      onChange(bridge.updateTransaction(tx, { memo }) as Transaction);
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
      maxMemoLength={MAX_MEMO_LENGTH}
      label={t("zcash.shielded.send.memo.label")}
      tooltipText={t("zcash.shielded.send.memo.tooltip")}
      placeholder={t("zcash.shielded.send.memo.placeholder")}
    />
  );
};

export default ZcashMemoField;
