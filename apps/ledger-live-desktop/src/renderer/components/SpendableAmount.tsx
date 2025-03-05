import React, { useEffect, useState } from "react";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import FormattedVal from "~/renderer/components/FormattedVal";
import BigNumber from "bignumber.js";
import { useAccountUnit } from "../hooks/useAccountUnit";

type Props<T extends TransactionCommon> = {
  account: AccountLike;
  transaction: T;
  parentAccount?: Account | undefined | null;
  prefix?: string;
  showAllDigits?: boolean;
  disableRounding?: boolean;
};

const SpendableAmount = <T extends TransactionCommon>({
  account,
  parentAccount,
  transaction,
  prefix,
  showAllDigits,
  disableRounding,
}: Props<T>) => {
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);
  const debouncedTransaction = useDebounce(transaction, 500);
  const accountUnit = useAccountUnit(account);
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
      data-testid="modal-spendable-banner"
    />
  ) : null;
};
export default SpendableAmount;
