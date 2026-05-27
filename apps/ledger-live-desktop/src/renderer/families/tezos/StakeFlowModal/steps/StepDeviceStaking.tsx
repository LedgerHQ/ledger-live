import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

export default function StepDeviceStaking({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: Readonly<StepProps>) {
  if (bridgePending || !transaction?.fees) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Stake Flow"
          name="Step ConnectDevice Staking Preparing"
          flow="stake"
          action="stake"
          currency="xtz"
        />
        <Spinner size={36} />
        <Text ff="Inter|Medium" fontSize={4} color="neutral.c80" mt={4} textAlign="center">
          <Trans i18nKey="tezos.stake.flow.preparingTransaction" />
        </Text>
      </Box>
    );
  }

  return (
    <>
      <TrackPage
        category="Stake Flow"
        name="Step ConnectDevice Staking"
        flow="stake"
        action="stake"
        currency="xtz"
      />
      <GenericStepConnectDevice
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
}
