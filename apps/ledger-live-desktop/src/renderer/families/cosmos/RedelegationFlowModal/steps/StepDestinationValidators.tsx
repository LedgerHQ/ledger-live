import invariant from "invariant";
import React, { useCallback } from "react";
import { StepProps } from "../types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import ValidatorField from "../fields/ValidatorField";
import { type Transaction } from "@ledgerhq/live-common/families/cosmos/types";

export default function StepValidators({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  transitionTo,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const updateRedelegation = useCallback(
    (newTransaction: Partial<Transaction>) => {
      onUpdateTransaction(transaction => bridge.updateTransaction(transaction, newTransaction));
    },
    [bridge, onUpdateTransaction],
  );

  const updateDestinationValidator = useCallback(
    ({ address }: { address: string }) => {
      updateRedelegation({
        ...transaction,
        dstValAddress: address,
      });
      transitionTo("validators");
    },
    [updateRedelegation, transaction, transitionTo],
  );
  return (
    <ValidatorField
      transaction={transaction}
      account={account}
      onChange={updateDestinationValidator}
    />
  );
}
