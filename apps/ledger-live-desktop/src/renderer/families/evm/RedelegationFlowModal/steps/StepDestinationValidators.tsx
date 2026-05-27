import invariant from "invariant";
import React, { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import ValidatorField from "../fields/ValidatorField";
import { StepProps } from "../types";

export default function StepDestinationValidators({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  transitionTo,
}: Readonly<StepProps>) {
  invariant(transaction, "transaction required");

  const bridge = useAccountBridge<GenericTransaction>(account, parentAccount);

  const updateDestinationValidator = useCallback(
    (address: string) => {
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          dstValAddress: address,
          amount: transaction.amount,
        }),
      );
      transitionTo("validators");
    },
    [bridge, onUpdateTransaction, transitionTo, transaction.amount],
  );

  return (
    <ValidatorField
      account={account}
      onChangeValidator={updateDestinationValidator}
      chosenVoteAccAddr={transaction.dstValAddress ?? ""}
      excludeAddress={transaction.valAddress}
    />
  );
}
