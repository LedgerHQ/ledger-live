import React, { useEffect, useState } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useDebounce } from "@ledgerhq/live-common//hooks/useDebounce";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import FormattedVal from "~/renderer/components/FormattedVal";
type Props = {
  account: AccountLike;
  transaction: Transaction;
  parentAccount: Account | undefined | null;
  prefix?: string;
  showAllDigits?: boolean;
  disableRounding?: boolean;
};
const SpendableAmount = ({
  account,
  parentAccount,
  transaction,
  prefix,
  showAllDigits,
  disableRounding,
}: Props) => {
  const [maxSpendable, setMaxSpendable] = useState(null);
  const debouncedTransaction = useDebounce(transaction, 500);
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    getAccountBridge(account, parentAccount)
      .estimateMaxSpendable({
        account,
        parentAccount,
        transaction: debouncedTransaction,
      })
      .then(estimate => {
        if (cancelled) return;
        setMaxSpendable(estimate);
      });
    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, debouncedTransaction]);
  const accountUnit = getAccountUnit(account);
  return maxSpendable ? (
    <FormattedVal
      style={{
        width: "auto",
      }}
      color="palette.text.shade100"
      val={maxSpendable}
      unit={accountUnit}
      prefix={prefix}
      disableRounding={disableRounding}
      showAllDigits={showAllDigits}
      showCode
      alwaysShowValue
    />
  ) : null;
};
export default SpendableAmount;
