import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
type Props = {
  onChange: (a: Transaction) => void;
  transaction: Transaction;
  account: Account;
  autoFocus?: boolean;
};
const uint32maxPlus1 = BigNumber(2).pow(32);
const TagField = ({ onChange, account, transaction, autoFocus }: Props) => {
  const onChangeTag = useCallback(
    (str: string) => {
      const bridge = getAccountBridge(account);
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
    [onChange, account, transaction],
  );
  return (
    <MemoTagField
      value={String(transaction.tag || "")}
      onChange={onChangeTag}
      autoFocus={autoFocus}
    />
  );
};
export default {
  component: TagField,
  fields: ["tag"],
};
