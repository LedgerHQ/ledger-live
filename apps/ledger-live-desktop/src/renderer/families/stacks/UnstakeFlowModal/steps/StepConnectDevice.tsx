import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

const StepConnectDevice = ({
  account,
  transaction,
  status,
  bridgePending,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: StepProps) => {
  // Mirrors the Stake flow's own gate (StakeFlowModal/steps/StepConnectDevice.tsx): coin-stacks's
  // signOperation.ts throws FeeNotLoaded when `fee` isn't set yet, and this step can mount before
  // the async fee estimate (bridgePending) resolves -- an already-connected device would otherwise
  // start signing immediately instead of waiting for preparation.
  if (bridgePending || !(transaction?.fee || transaction?.fees)) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Unstake Flow"
          name="Step ConnectDevice Preparing"
          flow="stake"
          action="undelegate"
          currency="stx"
        />
        <Spinner size={36} />
        <Text ff="Inter|Medium" fontSize={4} color="neutral.c80" mt={4} textAlign="center">
          <Trans i18nKey="stacks.unstake.flow.preparingTransaction" />
        </Text>
      </Box>
    );
  }

  return (
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
};

export default StepConnectDevice;
