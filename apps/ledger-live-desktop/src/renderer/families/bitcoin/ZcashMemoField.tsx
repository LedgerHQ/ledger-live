import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashTransaction } from "@ledgerhq/coin-zcash/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

// Memo can only be attached to shielded outputs (512 bytes max, ZIP-302).
const MAX_MEMO_BYTES = 512;

const encoder = new TextEncoder();

// The limit is defined in bytes, but MemoTagField's maxLength caps characters, so
// multi-byte input could still exceed it. Truncate to whole characters that fit in the
// byte budget so the constraint is enforced as the user types instead of at signing time.
const truncateToBytes = (value: string, maxBytes: number): string => {
  if (encoder.encode(value).length <= maxBytes) return value;
  let result = "";
  for (const char of value) {
    if (encoder.encode(result + char).length > maxBytes) break;
    result += char;
  }
  return result;
};

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
      const truncated = truncateToBytes(memo, MAX_MEMO_BYTES);
      onChange(bridge.updateTransaction(tx, { memo: truncated }) as Transaction);
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
      maxMemoLength={MAX_MEMO_BYTES}
      label={t("zcash.shielded.send.memo.label")}
      tooltipText={t("zcash.shielded.send.memo.tooltip")}
      placeholder={t("zcash.shielded.send.memo.placeholder")}
    />
  );
};

export default ZcashMemoField;
