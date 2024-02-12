import invariant from "invariant";
import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import ValidatorField from "../fields/ValidatorField";
import { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
export default function StepValidators({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  transitionTo,
}: StepProps) {
  invariant(account && account.cosmosResources && transaction, "account and transaction required");
  const bridge = getAccountBridge(account, parentAccount);
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
        validators: [
          {
            address,
            amount:
              transaction.validators && transaction.validators[0]
                ? transaction.validators[0].amount || BigNumber(0)
                : BigNumber(0),
          },
        ],
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
