import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

const StepConnectDevice = ({
  account,
  parentAccount,
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
      action="unstake"
      currency="xtz"
    />
    <GenericStepConnectDevice
      modalName="MODAL_TEZOS_UNSTAKE"
      account={account}
      parentAccount={parentAccount}
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
