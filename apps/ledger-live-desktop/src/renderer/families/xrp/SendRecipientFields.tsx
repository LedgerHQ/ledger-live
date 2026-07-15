import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
type Props = {
  onChange: (a: Transaction) => void;
  transaction: Transaction;
  account: Account;
  status: TransactionStatus;
  autoFocus?: boolean;
};
const uint32maxPlus1 = BigNumber(2).pow(32);
const TagField = ({ onChange, account, transaction, status, autoFocus }: Props) => {
  const bridge = useAccountBridge<Transaction>(account);
  const onChangeTag = useCallback(
    (str: string) => {
      const tag = BigNumber(str.replace(/[^0-9]/g, ""));
      const patch = {
        tag:
          !tag.isNaN() &&
          tag.isFinite() &&
          tag.isInteger() &&
          tag.isPositive() &&
          tag.lt(uint32maxPlus1)
            ? tag.toNumber()
            : str === ""
              ? undefined
              : transaction.tag,
      };
      onChange(bridge.updateTransaction(transaction, patch));
    },
    [bridge, onChange, transaction],
  );
  return (
    <MemoTagField
      value={String(transaction.tag ?? "")}
      onChange={onChangeTag}
      error={status.errors.transaction}
      warning={status.warnings.transaction}
      autoFocus={autoFocus}
    />
  );
};
export default {
  component: TagField,
  fields: ["tag"],
};
