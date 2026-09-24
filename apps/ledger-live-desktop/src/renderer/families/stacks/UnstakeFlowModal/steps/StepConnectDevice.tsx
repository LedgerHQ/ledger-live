import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

const StepConnectDevice = ({
  account,
  transaction,
  status,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: StepProps) => (
  <>
    <TrackPage
      category="Unstake Flow"
      name="Step ConnectDevice"
      flow="stake"
      action="undelegate"
      currency="stx"
    />
    <GenericStepConnectDevice
      modalName="MODAL_STACKS_UNSTAKE"
      account={account}
      transaction={transaction}
      status={status}
      transitionTo={transitionTo}
      onOperationBroadcasted={onOperationBroadcasted}
      onTransactionError={onTransactionError}
      setSigned={setSigned}
    />
  </>
);

export default StepConnectDevice;
