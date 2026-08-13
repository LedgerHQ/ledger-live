import React, { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
import WarnBox from "~/renderer/components/WarnBox";
import { useTranslation } from "react-i18next";

const MemoField = ({
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
  const { t } = useTranslation();
  invariant(transaction.family === "internet_computer", "Memo: Internet Computer family expected");

  const bridge = useAccountBridge<Transaction>(account);

  const onMemoFieldChange = useCallback(
    (value: string) => {
      if (value !== "") onChange(bridge.updateTransaction(transaction, { memo: value }));
      else onChange(bridge.updateTransaction(transaction, { memo: undefined }));
    },
    [onChange, transaction, bridge],
  );

  // Staking transfers carry a protocol-derived memo (the neuron nonce) that prepareTransaction
  // sets, so the field is replaced by an explanation rather than left editable.
  if (transaction.type === "increase_stake") {
    return <WarnBox>{t("internetComputer.memoField.increaseStake")}</WarnBox>;
  }

  if (transaction.type === "create_neuron") {
    return <WarnBox>{t("internetComputer.memoField.createNeuron")}</WarnBox>;
  }

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo ?? ""}
      onChange={onMemoFieldChange}
      spellCheck="false"
      autoFocus={autoFocus}
      tooltipText={t("internetComputer.memoField.tooltip")}
    />
  );
};

export default MemoField;
