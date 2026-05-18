import React, { useCallback, useRef } from "react";
import { Operation } from "@ledgerhq/types-live";
import TrackPage from "~/renderer/analytics/TrackPage";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

export default function StepDeviceDelegation({
  account,
  parentAccount,
  transaction,
  status,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: Readonly<StepProps>) {
  // GenericStepConnectDevice always calls transitionTo("confirmation") after broadcast
  // (success or failure). We want success to land on "amount" so the user signs the
  // staking op next, while errors must still go to "confirmation".
  const broadcastedRef = useRef(false);

  const handleBroadcasted = useCallback(
    (op: Operation) => {
      broadcastedRef.current = true;
      onOperationBroadcasted(op);
    },
    [onOperationBroadcasted],
  );

  const handleTransition = useCallback(
    (next: string) => {
      if (next === "confirmation" && broadcastedRef.current) {
        broadcastedRef.current = false;
        transitionTo("amount");
        return;
      }
      transitionTo(next);
    },
    [transitionTo],
  );

  return (
    <>
      <TrackPage
        category="Stake Flow"
        name="Step ConnectDevice Delegation"
        flow="stake"
        action="stake"
        currency="xtz"
      />
      <GenericStepConnectDevice
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        transitionTo={handleTransition}
        onOperationBroadcasted={handleBroadcasted}
        onTransactionError={onTransactionError}
        setSigned={setSigned}
      />
    </>
  );
}
