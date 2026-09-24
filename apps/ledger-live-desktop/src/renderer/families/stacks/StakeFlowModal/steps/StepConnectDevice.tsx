import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

export default function StepConnectDevice({
  account,
  transaction,
  status,
  bridgePending,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: Readonly<StepProps>) {
  // startBurnHt is resolved asynchronously by Body when this step is entered; wait for it so the
  // device step never prepares a transaction with a stale (or missing) burn height.
  if (
    bridgePending ||
    !transaction?.fee ||
    transaction.familySpecificData?.startBurnHt === undefined
  ) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Stake Flow"
          name="Step ConnectDevice Preparing"
          flow="stake"
          action="delegate"
          currency="stx"
        />
        <Spinner size={36} />
        <Text ff="Inter|Medium" fontSize={4} color="neutral.c80" mt={4} textAlign="center">
          <Trans i18nKey="stacks.stake.flow.preparingTransaction" />
        </Text>
      </Box>
    );
  }

  return (
    <>
      <TrackPage
        category="Stake Flow"
        name="Step ConnectDevice"
        flow="stake"
        action="delegate"
        currency="stx"
      />
      <GenericStepConnectDevice
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
}
