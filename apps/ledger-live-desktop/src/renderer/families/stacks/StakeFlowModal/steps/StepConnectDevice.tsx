import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

export default function StepConnectDevice({
  account,
  transaction,
  status,
  bridgePending,
  error,
  onRetry,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: Readonly<StepProps>) {
  // A rejected fetchPoxInfo() (Body's resolveStartBurnHt) surfaces here as `error` -- without this
  // branch startBurnHt stays undefined forever and the spinner below never yields to a retry option.
  if (error) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Stake Flow"
          name="Step ConnectDevice Preparing Error"
          flow="stake"
          action="delegate"
          currency="stx"
        />
        <ErrorDisplay error={error} onRetry={onRetry} withExportLogs />
      </Box>
    );
  }

  // startBurnHt is resolved asynchronously by Body when this step is entered; wait for it so the
  // device step never prepares a transaction with a stale (or missing) burn height. Checks both
  // `fee` (today's classic bridge) and `fees` (the `GenericTransaction` field the documented
  // flag-flip PR will route Stacks through instead) so this survives that migration.
  if (
    bridgePending ||
    !(transaction?.fee || transaction?.fees) ||
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
